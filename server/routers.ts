import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { nanoid } from "nanoid";

// Role-based access control middleware
// Super Admin: Unrestricted access
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Super Admin access required' });
  }
  return next({ ctx });
});

// Manager: Operational data, financial reports, staff management
const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!['super_admin', 'manager'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Manager access required' });
  }
  return next({ ctx });
});

// Employee: Inventory view/update, orders create/process
const employeeProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!['super_admin', 'manager', 'employee'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Employee access required' });
  }
  return next({ ctx });
});

// Business Client: View-only, AI predictions for their account
const businessClientProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'business_client') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Business Client access required' });
  }
  return next({ ctx });
});

// AI Predictions: Super Admin and Business Client only
const aiPredictionsProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!['super_admin', 'business_client'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'AI Predictions access restricted to Super Admin and Business Client' });
  }
  return next({ ctx });
});

// Legacy aliases for backward compatibility
const adminProcedure = superAdminProcedure;
const operationsProcedure = employeeProcedure;
const financeProcedure = managerProcedure;

// Helper to create audit log
async function logAction(
  userId: number,
  userName: string | null,
  action: string,
  entityType: string,
  entityId?: number,
  previousData?: unknown,
  newData?: unknown
) {
  await db.createAuditLog({
    userId,
    userName: userName || undefined,
    action,
    entityType,
    entityId,
    previousData: previousData ? JSON.stringify(previousData) : undefined,
    newData: newData ? JSON.stringify(newData) : undefined,
  });
}

// Helper to create data version
async function createVersion(
  entityType: string,
  entityId: number,
  data: unknown,
  changeDescription: string,
  userId: number,
  userName: string | null
) {
  const latestVersion = await db.getLatestDataVersion(entityType, entityId);
  const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
  
  await db.createDataVersion({
    entityType,
    entityId,
    versionNumber,
    data: JSON.stringify(data),
    changeDescription,
    createdBy: userId,
    createdByName: userName || undefined,
  });
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // User Management
  users: router({
    list: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['super_admin', 'manager', 'employee', 'business_client']),
        linkedClientId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.userId, input.role, input.linkedClientId);
        await logAction(ctx.user.id, ctx.user.name, 'UPDATE_ROLE', 'user', input.userId, null, { role: input.role, linkedClientId: input.linkedClientId });
        return { success: true };
      }),
  }),

  // Audit Logs
  auditLogs: router({
    list: adminProcedure
      .input(z.object({
        entityType: z.string().optional(),
        userId: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getAuditLogs(input);
      }),
  }),

  // Suppliers
  suppliers: router({
    list: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return db.getSuppliers(input?.activeOnly ?? true);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierById(input.id);
      }),
    create: operationsProcedure
      .input(z.object({
        name: z.string().min(1),
        country: z.string().optional(),
        region: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        leadTimeDays: z.number().optional(),
        orderCadenceDays: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createSupplier({ ...input, createdBy: ctx.user.id });
        await logAction(ctx.user.id, ctx.user.name, 'CREATE', 'supplier', id, null, input);
        await createVersion('supplier', id, input, 'Initial creation', ctx.user.id, ctx.user.name);
        return { id };
      }),
    update: operationsProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        country: z.string().optional(),
        region: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        leadTimeDays: z.number().optional(),
        orderCadenceDays: z.number().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const previous = await db.getSupplierById(id);
        await db.updateSupplier(id, { ...data, updatedBy: ctx.user.id });
        await logAction(ctx.user.id, ctx.user.name, 'UPDATE', 'supplier', id, previous, data);
        const updated = await db.getSupplierById(id);
        await createVersion('supplier', id, updated, 'Updated supplier details', ctx.user.id, ctx.user.name);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const previous = await db.getSupplierById(input.id);
        await db.deleteSupplier(input.id);
        await logAction(ctx.user.id, ctx.user.name, 'DELETE', 'supplier', input.id, previous, null);
        return { success: true };
      }),
  }),

  // Clients
  clients: router({
    list: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return db.getClients(input?.activeOnly ?? true);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getClientById(input.id);
      }),
    create: operationsProcedure
      .input(z.object({
        name: z.string().min(1),
        businessType: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        specialDiscount: z.string().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createClient({ ...input, createdBy: ctx.user.id });
        await logAction(ctx.user.id, ctx.user.name, 'CREATE', 'client', id, null, input);
        await createVersion('client', id, input, 'Initial creation', ctx.user.id, ctx.user.name);
        return { id };
      }),
    update: operationsProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        businessType: z.string().optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        specialDiscount: z.string().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const previous = await db.getClientById(id);
        await db.updateClient(id, { ...data, updatedBy: ctx.user.id });
        await logAction(ctx.user.id, ctx.user.name, 'UPDATE', 'client', id, previous, data);
        const updated = await db.getClientById(id);
        await createVersion('client', id, updated, 'Updated client details', ctx.user.id, ctx.user.name);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const previous = await db.getClientById(input.id);
        await db.deleteClient(input.id);
        await logAction(ctx.user.id, ctx.user.name, 'DELETE', 'client', input.id, previous, null);
        return { success: true };
      }),
  }),

  // Matcha SKUs
  skus: router({
    list: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return db.getMatchaSkus(input?.activeOnly ?? true);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchaSkuById(input.id);
      }),
    bySupplier: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchaSkusBySupplierId(input.supplierId);
      }),
    create: operationsProcedure
      .input(z.object({
        supplierId: z.number(),
        name: z.string().min(1),
        grade: z.enum(['ceremonial', 'premium', 'culinary', 'food_grade']),
        qualityTier: z.number().min(1).max(5).optional(),
        isSeasonal: z.boolean().optional(),
        harvestSeason: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createMatchaSku({ ...input, createdBy: ctx.user.id });
        // Create initial inventory record
        await db.createInventory({ skuId: id });
        await logAction(ctx.user.id, ctx.user.name, 'CREATE', 'sku', id, null, input);
        await createVersion('sku', id, input, 'Initial creation', ctx.user.id, ctx.user.name);
        return { id };
      }),
    update: operationsProcedure
      .input(z.object({
        id: z.number(),
        supplierId: z.number().optional(),
        name: z.string().min(1).optional(),
        grade: z.enum(['ceremonial', 'premium', 'culinary', 'food_grade']).optional(),
        qualityTier: z.number().min(1).max(5).optional(),
        isSeasonal: z.boolean().optional(),
        harvestSeason: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const previous = await db.getMatchaSkuById(id);
        await db.updateMatchaSku(id, { ...data, updatedBy: ctx.user.id });
        await logAction(ctx.user.id, ctx.user.name, 'UPDATE', 'sku', id, previous, data);
        const updated = await db.getMatchaSkuById(id);
        await createVersion('sku', id, updated, 'Updated SKU details', ctx.user.id, ctx.user.name);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const previous = await db.getMatchaSkuById(input.id);
        await db.deleteMatchaSku(input.id);
        await logAction(ctx.user.id, ctx.user.name, 'DELETE', 'sku', input.id, previous, null);
        return { success: true };
      }),
  }),

  // Pricing
  pricing: router({
    current: protectedProcedure.query(async () => {
      return db.getCurrentPricing();
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPricingById(input.id);
      }),
    bySku: protectedProcedure
      .input(z.object({ skuId: z.number() }))
      .query(async ({ input }) => {
        return db.getPricingBySkuId(input.skuId);
      }),
    history: protectedProcedure
      .input(z.object({ skuId: z.number() }))
      .query(async ({ input }) => {
        return db.getPricingHistory(input.skuId);
      }),
    create: financeProcedure
      .input(z.object({
        skuId: z.number(),
        costPriceJpy: z.string(),
        exchangeRate: z.string(),
        shippingFeePerKg: z.string().optional(),
        importTaxRate: z.string().optional(),
        sellingPricePerKg: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Mark previous pricing as not current
        const existingPricing = await db.getPricingBySkuId(input.skuId);
        if (existingPricing) {
          await db.updatePricing(existingPricing.id, { isCurrentPrice: false, effectiveTo: new Date() });
        }
        
        const id = await db.createPricing({ ...input, createdBy: ctx.user.id });
        await logAction(ctx.user.id, ctx.user.name, 'CREATE', 'pricing', id, null, input);
        
        // Check for significant price changes and create notification
        if (existingPricing) {
          const oldCost = Number(existingPricing.costPriceJpy);
          const newCost = Number(input.costPriceJpy);
          const changePercent = Math.abs((newCost - oldCost) / oldCost * 100);
          
          if (changePercent >= 5) {
            await db.createNotification({
              type: 'price_change',
              title: 'Significant Price Change Detected',
              message: `Cost price for SKU #${input.skuId} changed by ${changePercent.toFixed(1)}%`,
              severity: changePercent >= 10 ? 'critical' : 'warning',
              entityType: 'pricing',
              entityId: id,
            });
          }
        }
        
        return { id };
      }),
    update: financeProcedure
      .input(z.object({
        id: z.number(),
        costPriceJpy: z.string().optional(),
        exchangeRate: z.string().optional(),
        shippingFeePerKg: z.string().optional(),
        importTaxRate: z.string().optional(),
        sellingPricePerKg: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const previous = await db.getPricingById(id);
        await db.updatePricing(id, { ...data, updatedBy: ctx.user.id });
        await logAction(ctx.user.id, ctx.user.name, 'UPDATE', 'pricing', id, previous, data);
        return { success: true };
      }),
  }),

  // Inventory
  inventory: router({
    list: protectedProcedure.query(async () => {
      return db.getInventory();
    }),
    get: protectedProcedure
      .input(z.object({ skuId: z.number() }))
      .query(async ({ input }) => {
        return db.getInventoryBySkuId(input.skuId);
      }),
    lowStock: protectedProcedure.query(async () => {
      return db.getLowStockInventory();
    }),
    update: operationsProcedure
      .input(z.object({
        id: z.number(),
        totalStockKg: z.string().optional(),
        allocatedStockKg: z.string().optional(),
        lowStockThresholdKg: z.string().optional(),
        lastOrderDate: z.date().optional(),
        lastArrivalDate: z.date().optional(),
        nextExpectedArrival: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateInventory(id, { ...data, updatedBy: ctx.user.id });
        await logAction(ctx.user.id, ctx.user.name, 'UPDATE', 'inventory', id, null, data);
        return { success: true };
      }),
    transactions: protectedProcedure
      .input(z.object({ skuId: z.number().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getInventoryTransactions(input?.skuId, input?.limit);
      }),
    createTransaction: operationsProcedure
      .input(z.object({
        skuId: z.number(),
        transactionType: z.enum(['purchase', 'sale', 'adjustment', 'allocation', 'deallocation']),
        quantityKg: z.string(),
        referenceType: z.string().optional(),
        referenceId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const inv = await db.getInventoryBySkuId(input.skuId);
        if (!inv) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Inventory not found for this SKU' });
        }
        
        const id = await db.createInventoryTransaction({
          ...input,
          inventoryId: inv.id,
          createdBy: ctx.user.id,
        });
        
        await logAction(ctx.user.id, ctx.user.name, 'CREATE', 'inventory_transaction', id, null, input);
        
        // Check for low stock after transaction
        const updatedInv = await db.getInventoryBySkuId(input.skuId);
        if (updatedInv) {
          const unallocated = Number(updatedInv.totalStockKg) - Number(updatedInv.allocatedStockKg);
          const threshold = Number(updatedInv.lowStockThresholdKg);
          
          if (unallocated <= threshold) {
            await db.createNotification({
              type: 'low_stock',
              title: 'Low Stock Alert',
              message: `SKU #${input.skuId} has only ${unallocated.toFixed(2)}kg unallocated stock remaining`,
              severity: unallocated <= threshold / 2 ? 'critical' : 'warning',
              entityType: 'inventory',
              entityId: inv.id,
            });
          }
        }
        
        return { id };
      }),
  }),

  // Client Orders
  clientOrders: router({
    list: protectedProcedure
      .input(z.object({
        clientId: z.number().optional(),
        status: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getClientOrders(input);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getClientOrderById(input.id);
      }),
    create: operationsProcedure
      .input(z.object({
        clientId: z.number(),
        skuId: z.number(),
        quantityKg: z.string(),
        unitPriceSgd: z.string(),
        deliveryDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Calculate total and profit
        const pricing = await db.getPricingBySkuId(input.skuId);
        const totalPrice = Number(input.quantityKg) * Number(input.unitPriceSgd);
        const landedCost = pricing ? Number(pricing.landedCostSgd) : 0;
        const profit = totalPrice - (Number(input.quantityKg) * landedCost);
        
        const id = await db.createClientOrder({
          ...input,
          totalPriceSgd: totalPrice.toFixed(2),
          profitSgd: profit.toFixed(2),
          createdBy: ctx.user.id,
        });
        
        await logAction(ctx.user.id, ctx.user.name, 'CREATE', 'client_order', id, null, input);
        return { id };
      }),
    update: operationsProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']).optional(),
        deliveryDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const previous = await db.getClientOrderById(id);
        await db.updateClientOrder(id, data);
        await logAction(ctx.user.id, ctx.user.name, 'UPDATE', 'client_order', id, previous, data);
        return { success: true };
      }),
  }),

  // Supplier Orders
  supplierOrders: router({
    list: protectedProcedure
      .input(z.object({
        supplierId: z.number().optional(),
        status: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getSupplierOrders(input);
      }),
    create: operationsProcedure
      .input(z.object({
        supplierId: z.number(),
        expectedArrivalDate: z.date().optional(),
        exchangeRateUsed: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createSupplierOrder({ ...input, createdBy: ctx.user.id });
        await logAction(ctx.user.id, ctx.user.name, 'CREATE', 'supplier_order', id, null, input);
        return { id };
      }),
    update: operationsProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['draft', 'submitted', 'confirmed', 'shipped', 'arrived', 'cancelled']).optional(),
        expectedArrivalDate: z.date().optional(),
        actualArrivalDate: z.date().optional(),
        totalCostJpy: z.string().optional(),
        totalCostSgd: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateSupplierOrder(id, data);
        await logAction(ctx.user.id, ctx.user.name, 'UPDATE', 'supplier_order', id, null, data);
        return { success: true };
      }),
    addItem: operationsProcedure
      .input(z.object({
        supplierOrderId: z.number(),
        skuId: z.number(),
        quantityKg: z.string(),
        unitPriceJpy: z.string(),
      }))
      .mutation(async ({ input }) => {
        const totalPrice = Number(input.quantityKg) * Number(input.unitPriceJpy);
        const id = await db.createSupplierOrderItem({
          ...input,
          totalPriceJpy: totalPrice.toFixed(2),
        });
        return { id };
      }),
    getItems: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierOrderItems(input.orderId);
      }),
  }),

  // Demand Forecasts
  forecasts: router({
    list: protectedProcedure
      .input(z.object({
        clientId: z.number().optional(),
        skuId: z.number().optional(),
        month: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getDemandForecasts(input);
      }),
    create: operationsProcedure
      .input(z.object({
        clientId: z.number().optional(),
        skuId: z.number().optional(),
        forecastMonth: z.string(),
        projectedDemandKg: z.string(),
        confidenceLevel: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDemandForecast(input);
        return { id };
      }),
    update: operationsProcedure
      .input(z.object({
        id: z.number(),
        actualDemandKg: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDemandForecast(id, data);
        return { success: true };
      }),
  }),

  // Data Versions (for rollback)
  versions: router({
    list: protectedProcedure
      .input(z.object({
        entityType: z.string(),
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        return db.getDataVersions(input.entityType, input.entityId);
      }),
    rollback: adminProcedure
      .input(z.object({
        entityType: z.string(),
        entityId: z.number(),
        versionNumber: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const versions = await db.getDataVersions(input.entityType, input.entityId);
        const targetVersion = versions.find(v => v.versionNumber === input.versionNumber);
        
        if (!targetVersion) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Version not found' });
        }
        
        const data = JSON.parse(targetVersion.data as string);
        
        // Restore based on entity type
        switch (input.entityType) {
          case 'supplier':
            await db.updateSupplier(input.entityId, data);
            break;
          case 'client':
            await db.updateClient(input.entityId, data);
            break;
          case 'sku':
            await db.updateMatchaSku(input.entityId, data);
            break;
          default:
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown entity type' });
        }
        
        await logAction(ctx.user.id, ctx.user.name, 'ROLLBACK', input.entityType, input.entityId, null, { toVersion: input.versionNumber });
        await createVersion(input.entityType, input.entityId, data, `Rolled back to version ${input.versionNumber}`, ctx.user.id, ctx.user.name);
        
        return { success: true };
      }),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getNotifications(ctx.user.id, input?.unreadOnly);
      }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.id);
        return { success: true };
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // Analytics
  analytics: router({
    monthlyProfit: protectedProcedure
      .input(z.object({ months: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getMonthlyProfitSummary(input?.months);
      }),
    clientProfitability: protectedProcedure.query(async () => {
      return db.getClientProfitability();
    }),
    skuProfitability: protectedProcedure.query(async () => {
      return db.getSkuProfitability();
    }),
    businessContext: protectedProcedure.query(async () => {
      return db.getBusinessContext();
    }),
  }),

  // AI Chat
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1),
        sessionId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const sessionId = input.sessionId || nanoid();
        const userRole = ctx.user.role;
        
        // Role-based permission checks
        const canViewCosts = ['admin', 'finance'].includes(userRole);
        const canViewMargins = ['admin', 'finance'].includes(userRole);
        const canAccessAI = ['admin', 'finance', 'operations'].includes(userRole);
        
        // Block AI access for view_only users
        if (!canAccessAI) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'AI Assistant access is restricted for your role. Please contact an administrator.' 
          });
        }
        
        // Get business context for AI (filtered by role)
        const rawBusinessContext = await db.getBusinessContext();
        
        // Filter sensitive data based on role
        const businessContext = rawBusinessContext ? {
          ...rawBusinessContext,
          // Remove cost data for non-authorized users
          pricing: canViewCosts ? rawBusinessContext.pricing : rawBusinessContext.pricing?.map((p: any) => ({
            ...p,
            costPriceJpy: '[RESTRICTED]',
            landedCostSgd: '[RESTRICTED]',
          })),
          // Remove margin data for non-authorized users
          skus: rawBusinessContext.skus,
          suppliers: canViewCosts ? rawBusinessContext.suppliers : rawBusinessContext.suppliers?.map((s: any) => ({
            ...s,
            paymentTerms: '[RESTRICTED]',
            leadTimeDays: s.leadTimeDays,
          })),
        } : null;
        
        // Get chat history
        const history = await db.getAiChatHistory(sessionId, 10);
        
        // Save user message
        await db.createAiChatMessage({
          userId: ctx.user.id,
          sessionId,
          role: 'user',
          content: input.message,
        });
        
        // Detect if this is a what-if scenario question
        const scenarioKeywords = ['what if', 'what-if', 'scenario', 'impact', 'change price', 'increase', 'decrease', 'margin', 'forecast', 'projection', 'compare', 'analysis'];
        const isScenarioQuestion = scenarioKeywords.some(kw => input.message.toLowerCase().includes(kw));
        
        // Build messages for LLM with role-based restrictions
        const roleRestrictions = !canViewCosts ? `
IMPORTANT SECURITY RESTRICTIONS:
- The current user (${ctx.user.name}, role: ${userRole}) does NOT have permission to view cost prices, landed costs, or profit margins.
- You MUST NOT reveal any cost data, supplier pricing, or margin calculations in your responses.
- If asked about costs or margins, politely explain that this information is restricted to Finance and Admin roles.
- Focus on inventory levels, order status, and general business operations instead.
` : '';
        
        const systemPrompt = `You are an AI assistant for Matsu Matcha, a B2B matcha distribution company. You help analyze business data, provide recommendations, and answer questions about inventory, pricing, profitability, and demand forecasting.
${roleRestrictions}
Current Business Context:
- Suppliers: ${businessContext?.suppliers?.length || 0} active suppliers
- Clients: ${businessContext?.clients?.length || 0} active clients
- SKUs: ${businessContext?.skus?.length || 0} matcha products
- Low Stock Alerts: ${businessContext?.lowStockAlerts?.length || 0} items
- User Role: ${userRole} (${canViewCosts ? 'Full access' : 'Restricted - no cost/margin data'})

${businessContext ? `
Suppliers: ${JSON.stringify(businessContext.suppliers?.slice(0, 5))}
Clients: ${JSON.stringify(businessContext.clients?.slice(0, 5))}
SKUs: ${JSON.stringify(businessContext.skus?.slice(0, 5))}
Current Pricing: ${JSON.stringify(businessContext.pricing?.slice(0, 5))}
Inventory: ${JSON.stringify(businessContext.inventory?.slice(0, 5))}
Recent Orders: ${JSON.stringify(businessContext.recentOrders?.slice(0, 5))}
` : ''}

${isScenarioQuestion ? `
IMPORTANT: The user is asking a what-if scenario question. You MUST include a visualization block in your response using the following JSON format wrapped in <<<VISUALIZATION>>> tags:

<<<VISUALIZATION>>>
{
  "type": "pricing" | "margin" | "forecast" | "breakdown" | "comparison",
  "title": "Chart Title",
  "data": {
    // For pricing scenarios:
    "currentPrice": number,
    "currentMargin": number (percentage),
    "currentVolume": number,
    "productName": "string",
    "currency": "USD"
    
    // For margin comparisons:
    "products": [{ "name": "string", "currentMargin": number, "suggestedMargin": number, "revenue": number }]
    
    // For forecasts:
    "forecastData": [{ "month": "Jan", "actual": number, "forecast": number, "reorderPoint": number }],
    "productName": "string",
    "unit": "kg"
    
    // For breakdowns:
    "breakdown": [{ "category": "string", "value": number, "percentage": number }],
    "total": number,
    "currency": "USD"
  }
}
<<<VISUALIZATION>>>

Always provide realistic sample data based on the business context. Use actual product names, realistic prices, and margins when available.
` : ''}

Provide helpful, data-driven insights. When discussing pricing scenarios, show calculations. When recommending alternatives, explain the margin improvements. Be concise but thorough.`;

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemPrompt },
          ...history.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          })),
          { role: 'user', content: input.message },
        ];

        try {
          const response = await invokeLLM({ messages });
          const rawContent = response.choices[0]?.message?.content;
          const assistantMessage = typeof rawContent === 'string' ? rawContent : 'I apologize, but I was unable to generate a response.';
          
          // Save assistant response
          await db.createAiChatMessage({
            userId: ctx.user.id,
            sessionId,
            role: 'assistant',
            content: assistantMessage,
          });
          
          return {
            sessionId,
            response: assistantMessage,
          };
        } catch (error) {
          console.error('AI chat error:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate AI response' });
        }
      }),
    history: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return db.getAiChatHistory(input.sessionId);
      }),
    sessions: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserChatSessions(ctx.user.id);
    }),
    generateRecommendations: protectedProcedure
      .input(z.object({
        type: z.enum(['profitability', 'reorder', 'pricing']),
        skuId: z.number().optional(),
        clientId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const businessContext = await db.getBusinessContext();
        
        let prompt = '';
        switch (input.type) {
          case 'profitability':
            prompt = `Analyze the profitability of our matcha products and suggest higher-margin alternatives for clients. Focus on products with similar or better quality. Current data: ${JSON.stringify(businessContext)}`;
            break;
          case 'reorder':
            prompt = `Based on current inventory levels, lead times, and historical demand, suggest reorder quantities and timing for each SKU. Current data: ${JSON.stringify(businessContext)}`;
            break;
          case 'pricing':
            prompt = `Analyze current pricing strategy and suggest optimizations to improve margins while remaining competitive. Current data: ${JSON.stringify(businessContext)}`;
            break;
        }
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a business analyst AI for a B2B matcha distribution company. Provide specific, actionable recommendations with numbers and calculations.' },
            { role: 'user', content: prompt },
          ],
        });
        
        return {
          recommendations: response.choices[0]?.message?.content || 'Unable to generate recommendations.',
        };
      }),

    // Context-aware chat for specific pages
    contextChat: protectedProcedure
      .input(z.object({
        message: z.string().min(1),
        sessionId: z.string(),
        context: z.enum(['clients', 'suppliers', 'products', 'pricing', 'inventory', 'orders', 'analytics', 'general']),
        contextData: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { message, sessionId, context, contextData } = input;
        const userRole = ctx.user.role;
        
        // Get business context
        const businessContext = await db.getBusinessContext();
        
        // Get chat history for this session
        const history = await db.getAiChatHistory(sessionId, 10);
        
        // Save user message
        await db.createAiChatMessage({
          userId: ctx.user.id,
          sessionId,
          role: 'user',
          content: message,
        });
        
        // Build context-specific system prompt
        const contextPrompts: Record<string, string> = {
          clients: `You are an AI assistant specialized in B2B client management for Matsu Matcha. Help analyze client relationships, suggest pricing strategies, identify growth opportunities, and recommend retention strategies. Focus on client-specific insights.`,
          suppliers: `You are an AI assistant specialized in supplier management for Matsu Matcha. Help evaluate suppliers, compare costs and quality, analyze lead times, and suggest optimal ordering strategies. Focus on supplier performance and relationships.`,
          products: `You are an AI assistant specialized in product management for Matsu Matcha. Help analyze product performance, suggest pricing adjustments, identify best-sellers and slow movers, and recommend inventory levels. Focus on matcha product insights.`,
          pricing: `You are an AI assistant specialized in pricing strategy for Matsu Matcha. Help optimize pricing, calculate margins, analyze profitability scenarios, and suggest competitive pricing. Provide specific calculations and what-if analyses.`,
          inventory: `You are an AI assistant specialized in inventory management for Matsu Matcha. Help forecast demand, identify low stock items, suggest reorder quantities and timing, and optimize inventory levels. Focus on supply chain efficiency.`,
          orders: `You are an AI assistant specialized in order management for Matsu Matcha. Help analyze order patterns, identify trends, suggest fulfillment optimizations, and forecast future orders. Focus on order processing efficiency.`,
          analytics: `You are an AI assistant specialized in business analytics for Matsu Matcha. Help understand business metrics, identify trends, create insights, and provide actionable recommendations. Focus on data-driven decision making.`,
          general: `You are an AI assistant for Matsu Matcha, a B2B matcha distribution company. Help with any business questions, provide insights, and offer recommendations to improve operations.`,
        };
        
        const systemPrompt = `${contextPrompts[context] || contextPrompts.general}

Current Business Context:
- Total Suppliers: ${businessContext?.suppliers?.length || 0}
- Total Clients: ${businessContext?.clients?.length || 0}
- Total Products: ${businessContext?.skus?.length || 0}
- User: ${ctx.user.name} (${userRole})

${contextData ? `Page-specific data: ${contextData}` : ''}

Business Data Summary:
${JSON.stringify({
  suppliers: businessContext?.suppliers?.slice(0, 3),
  clients: businessContext?.clients?.slice(0, 3),
  skus: businessContext?.skus?.slice(0, 3),
  pricing: businessContext?.pricing?.slice(0, 3),
  inventory: businessContext?.inventory?.slice(0, 3),
}, null, 2)}

Provide helpful, concise, and actionable responses. Use specific numbers and data when available. Format responses with markdown for readability.`;
        
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemPrompt },
          ...history.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          })),
          { role: 'user', content: message },
        ];
        
        try {
          const response = await invokeLLM({ messages });
          const rawContent = response.choices[0]?.message?.content;
          const assistantMessage = typeof rawContent === 'string' ? rawContent : 'I apologize, but I was unable to generate a response.';
          
          // Save assistant response
          await db.createAiChatMessage({
            userId: ctx.user.id,
            sessionId,
            role: 'assistant',
            content: assistantMessage,
          });
          
          return {
            sessionId,
            response: assistantMessage,
          };
        } catch (error) {
          console.error('AI context chat error:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate AI response' });
        }
      }),

    // Query for context chat history
    contextChatHistory: protectedProcedure
      .input(z.object({ sessionId: z.string(), context: z.string() }))
      .query(async ({ input }) => {
        return db.getAiChatHistory(input.sessionId);
      }),

    // Quick suggestion for inline AI help
    quickSuggestion: protectedProcedure
      .input(z.object({
        context: z.enum(['clients', 'suppliers', 'products', 'pricing', 'inventory', 'orders', 'analytics', 'general']),
        prompt: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { context, prompt } = input;
        
        const systemPrompt = `You are a helpful AI assistant for Matsu Matcha. Provide a brief, actionable suggestion (2-3 sentences max) based on the context: ${context}. Be specific and practical.`;
        
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
          });
          
          const rawContent = response.choices[0]?.message?.content;
          return {
            suggestion: typeof rawContent === 'string' ? rawContent : 'Unable to generate suggestion.',
          };
        } catch (error) {
          console.error('Quick suggestion error:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate suggestion' });
        }
      }),

    // AI-powered data analysis for any entity
    analyzeEntity: protectedProcedure
      .input(z.object({
        entityType: z.enum(['client', 'supplier', 'product', 'order']),
        entityId: z.number(),
        analysisType: z.enum(['performance', 'recommendations', 'forecast', 'comparison']),
      }))
      .mutation(async ({ input, ctx }) => {
        const { entityType, entityId, analysisType } = input;
        const businessContext = await db.getBusinessContext();
        
        let entityData: any = null;
        let prompt = '';
        
        switch (entityType) {
          case 'client':
            entityData = await db.getClientById(entityId);
            const clientOrders = businessContext?.recentOrders?.filter((o: any) => o.clientId === entityId) || [];
            prompt = `Analyze this client and provide ${analysisType} insights:\n\nClient: ${JSON.stringify(entityData)}\nRecent Orders: ${JSON.stringify(clientOrders)}\nAll Clients for comparison: ${JSON.stringify(businessContext?.clients?.slice(0, 5))}`;
            break;
          case 'supplier':
            entityData = await db.getSupplierById(entityId);
            const supplierSkus = businessContext?.skus?.filter((s: any) => s.supplierId === entityId) || [];
            prompt = `Analyze this supplier and provide ${analysisType} insights:\n\nSupplier: ${JSON.stringify(entityData)}\nProducts from this supplier: ${JSON.stringify(supplierSkus)}\nAll Suppliers for comparison: ${JSON.stringify(businessContext?.suppliers?.slice(0, 5))}`;
            break;
          case 'product':
            entityData = await db.getMatchaSkuById(entityId);
            const productPricing = businessContext?.pricing?.filter((p: any) => p.skuId === entityId) || [];
            const productInventory = businessContext?.inventory?.filter((i: any) => i.skuId === entityId) || [];
            prompt = `Analyze this product and provide ${analysisType} insights:\n\nProduct: ${JSON.stringify(entityData)}\nPricing: ${JSON.stringify(productPricing)}\nInventory: ${JSON.stringify(productInventory)}\nAll Products for comparison: ${JSON.stringify(businessContext?.skus?.slice(0, 5))}`;
            break;
          case 'order':
            const order = businessContext?.recentOrders?.find((o: any) => o.id === entityId);
            prompt = `Analyze this order and provide ${analysisType} insights:\n\nOrder: ${JSON.stringify(order)}\nRecent Orders for comparison: ${JSON.stringify(businessContext?.recentOrders?.slice(0, 5))}`;
            break;
        }
        
        const systemPrompt = `You are a business analyst AI for Matsu Matcha. Provide detailed ${analysisType} analysis with specific numbers, percentages, and actionable recommendations. Format your response with clear sections using markdown.`;
        
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
          });
          
          const rawContent = response.choices[0]?.message?.content;
          return {
            entityType,
            entityId,
            analysisType,
            analysis: typeof rawContent === 'string' ? rawContent : 'Unable to generate analysis.',
          };
        } catch (error) {
          console.error('Entity analysis error:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate analysis' });
        }
      }),

    // AI-powered bulk recommendations
    bulkRecommendations: protectedProcedure
      .input(z.object({
        type: z.enum(['pricing_optimization', 'inventory_reorder', 'client_upsell', 'supplier_consolidation']),
      }))
      .mutation(async ({ input }) => {
        const { type } = input;
        const businessContext = await db.getBusinessContext();
        
        const prompts: Record<string, string> = {
          pricing_optimization: `Analyze all products and suggest pricing optimizations to improve margins. For each product, provide: current price, suggested price, expected margin improvement, and reasoning.\n\nProducts: ${JSON.stringify(businessContext?.skus)}\nPricing: ${JSON.stringify(businessContext?.pricing)}`,
          inventory_reorder: `Analyze inventory levels and suggest reorder quantities and timing for each product. Consider lead times, current stock, and demand patterns.\n\nInventory: ${JSON.stringify(businessContext?.inventory)}\nProducts: ${JSON.stringify(businessContext?.skus)}\nSuppliers: ${JSON.stringify(businessContext?.suppliers)}`,
          client_upsell: `Analyze each client's purchase history and suggest upsell opportunities. Recommend higher-margin or premium products that match their preferences.\n\nClients: ${JSON.stringify(businessContext?.clients)}\nOrders: ${JSON.stringify(businessContext?.recentOrders)}\nProducts: ${JSON.stringify(businessContext?.skus)}`,
          supplier_consolidation: `Analyze supplier relationships and suggest consolidation opportunities to reduce costs and improve efficiency.\n\nSuppliers: ${JSON.stringify(businessContext?.suppliers)}\nProducts by supplier: ${JSON.stringify(businessContext?.skus)}`,
        };
        
        const systemPrompt = `You are a strategic business analyst AI for Matsu Matcha. Provide comprehensive recommendations in a structured format with specific numbers and actionable steps. Use markdown tables where appropriate.`;
        
        try {
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompts[type] },
            ],
          });
          
          const rawContent = response.choices[0]?.message?.content;
          return {
            type,
            recommendations: typeof rawContent === 'string' ? rawContent : 'Unable to generate recommendations.',
          };
        } catch (error) {
          console.error('Bulk recommendations error:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate recommendations' });
        }
      }),
  }),

  // Client-Product Relations (Canonical Data Layer)
  clientProductRelations: router({
    list: protectedProcedure.query(async () => {
      return db.getClientProductRelations();
    }),
    create: managerProcedure
      .input(z.object({
        clientId: z.number(),
        skuId: z.number(),
        supplierId: z.number(),
        qualityTier: z.enum(['standard', 'premium', 'seasonal']).optional(),
        costPriceJpy: z.string(),
        exchangeRate: z.string(),
        shippingFeePerKg: z.string().optional(),
        importTaxRate: z.string().optional(),
        sellingPricePerKg: z.string(),
        specialDiscountPercent: z.string().optional(),
        monthlyPurchaseQtyKg: z.string(),
        orderingCadence: z.enum(['1_month', '2_months']).optional(),
        nextDeliveryDate: z.string().nullable().optional(),
        notes: z.string().optional(),
        importTaxAmountSgd: z.string().optional(),
        totalLandedCostSgd: z.string().optional(),
        profitPerKgSgd: z.string().optional(),
        totalProfitPerMonthSgd: z.string().optional(),
        annualizedProfitSgd: z.string().optional(),
        hasNegativeProfit: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { nextDeliveryDate, ...rest } = input;
        const createData = {
          ...rest,
          nextDeliveryDate: nextDeliveryDate ? new Date(nextDeliveryDate) : null,
        };
        const result = await db.createClientProductRelation(createData);
        await logAction(ctx.user.id, ctx.user.name, 'CREATE', 'client_product_relation', result.id, null, input);
        return result;
      }),
    update: managerProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(),
        skuId: z.number().optional(),
        supplierId: z.number().optional(),
        qualityTier: z.enum(['standard', 'premium', 'seasonal']).optional(),
        costPriceJpy: z.string().optional(),
        exchangeRate: z.string().optional(),
        shippingFeePerKg: z.string().optional(),
        importTaxRate: z.string().optional(),
        sellingPricePerKg: z.string().optional(),
        specialDiscountPercent: z.string().optional(),
        monthlyPurchaseQtyKg: z.string().optional(),
        orderingCadence: z.enum(['1_month', '2_months']).optional(),
        nextDeliveryDate: z.string().nullable().optional(),
        notes: z.string().optional(),
        importTaxAmountSgd: z.string().optional(),
        totalLandedCostSgd: z.string().optional(),
        profitPerKgSgd: z.string().optional(),
        totalProfitPerMonthSgd: z.string().optional(),
        annualizedProfitSgd: z.string().optional(),
        hasNegativeProfit: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, nextDeliveryDate, ...rest } = input;
        const updateData = {
          ...rest,
          nextDeliveryDate: nextDeliveryDate ? new Date(nextDeliveryDate) : null,
        };
        const previous = await db.getClientProductRelationById(id);
        await db.updateClientProductRelation(id, updateData);
        await logAction(ctx.user.id, ctx.user.name, 'UPDATE', 'client_product_relation', id, previous, input);
        await createVersion('client_product_relation', id, input, 'Updated client-product relation', ctx.user.id, ctx.user.name);
        return { success: true };
      }),
    delete: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const previous = await db.getClientProductRelationById(input.id);
        await db.deleteClientProductRelation(input.id);
        await logAction(ctx.user.id, ctx.user.name, 'DELETE', 'client_product_relation', input.id, previous, null);
        return { success: true };
      }),
  }),

  // Exchange Rates
  exchangeRates: router({
    latest: protectedProcedure.query(async () => {
      return db.getLatestExchangeRate();
    }),
    list: protectedProcedure.query(async () => {
      return db.getExchangeRates();
    }),
    create: managerProcedure
      .input(z.object({
        rate: z.number(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createExchangeRate(input.rate, input.source);
        await logAction(ctx.user.id, ctx.user.name, 'CREATE', 'exchange_rate', result.id, null, input);
        return result;
      }),
  }),

  // System Settings
  settings: router({
    list: adminProcedure.query(async () => {
      return db.getAllSystemSettings();
    }),
    get: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return db.getSystemSetting(input.key);
      }),
    set: adminProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.setSystemSetting(input.key, input.value, input.description, ctx.user.id);
        await logAction(ctx.user.id, ctx.user.name, 'UPDATE', 'system_setting', undefined, null, input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
