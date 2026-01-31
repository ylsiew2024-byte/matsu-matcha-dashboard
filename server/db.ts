import { eq, desc, and, sql, gte, lte, isNull, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  suppliers, InsertSupplier, Supplier,
  clients, InsertClient, Client,
  matchaSkus, InsertMatchaSku, MatchaSku,
  pricing, InsertPricing, Pricing,
  clientPricing, InsertClientPricing,
  inventory, InsertInventory, Inventory,
  inventoryTransactions, InsertInventoryTransaction,
  clientOrders, InsertClientOrder,
  supplierOrders, InsertSupplierOrder,
  supplierOrderItems, InsertSupplierOrderItem,
  demandForecasts, InsertDemandForecast,
  dataVersions, InsertDataVersion,
  aiChatHistory, InsertAiChatHistory,
  notifications, InsertNotification,
  auditLogs, InsertAuditLog,
  systemSettings, InsertSystemSetting
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER FUNCTIONS
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "operations" | "finance" | "view_only") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============================================
// AUDIT LOG FUNCTIONS
// ============================================

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(log);
}

export async function getAuditLogs(filters?: { entityType?: string; userId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(auditLogs);
  const conditions = [];
  
  if (filters?.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(desc(auditLogs.createdAt)).limit(filters?.limit || 100);
}

// ============================================
// SUPPLIER FUNCTIONS
// ============================================

export async function createSupplier(supplier: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(suppliers).values(supplier);
  return result[0].insertId;
}

export async function updateSupplier(id: number, supplier: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) return;
  await db.update(suppliers).set(supplier).where(eq(suppliers.id, id));
}

export async function getSuppliers(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  
  if (activeOnly) {
    return db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(suppliers.name);
  }
  return db.select().from(suppliers).orderBy(suppliers.name);
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(suppliers).set({ isActive: false }).where(eq(suppliers.id, id));
}

// ============================================
// CLIENT FUNCTIONS
// ============================================

export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(client);
  return result[0].insertId;
}

export async function updateClient(id: number, client: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clients).set(client).where(eq(clients.id, id));
}

export async function getClients(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  
  if (activeOnly) {
    return db.select().from(clients).where(eq(clients.isActive, true)).orderBy(clients.name);
  }
  return db.select().from(clients).orderBy(clients.name);
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(clients).set({ isActive: false }).where(eq(clients.id, id));
}

// ============================================
// MATCHA SKU FUNCTIONS
// ============================================

export async function createMatchaSku(sku: InsertMatchaSku) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matchaSkus).values(sku);
  return result[0].insertId;
}

export async function updateMatchaSku(id: number, sku: Partial<InsertMatchaSku>) {
  const db = await getDb();
  if (!db) return;
  await db.update(matchaSkus).set(sku).where(eq(matchaSkus.id, id));
}

export async function getMatchaSkus(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  
  if (activeOnly) {
    return db.select().from(matchaSkus).where(eq(matchaSkus.isActive, true)).orderBy(matchaSkus.name);
  }
  return db.select().from(matchaSkus).orderBy(matchaSkus.name);
}

export async function getMatchaSkuById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(matchaSkus).where(eq(matchaSkus.id, id)).limit(1);
  return result[0];
}

export async function getMatchaSkusBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchaSkus)
    .where(and(eq(matchaSkus.supplierId, supplierId), eq(matchaSkus.isActive, true)))
    .orderBy(matchaSkus.name);
}

export async function deleteMatchaSku(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(matchaSkus).set({ isActive: false }).where(eq(matchaSkus.id, id));
}

// ============================================
// PRICING FUNCTIONS
// ============================================

export async function createPricing(pricingData: InsertPricing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calculate landed cost
  const costJpy = Number(pricingData.costPriceJpy);
  const exchangeRate = Number(pricingData.exchangeRate);
  const shippingFee = Number(pricingData.shippingFeePerKg || 15);
  const taxRate = Number(pricingData.importTaxRate || 0.09);
  
  const costSgd = costJpy / exchangeRate;
  const landedCost = (costSgd + shippingFee) * (1 + taxRate);
  
  const result = await db.insert(pricing).values({
    ...pricingData,
    landedCostSgd: landedCost.toFixed(2)
  });
  return result[0].insertId;
}

export async function updatePricing(id: number, pricingData: Partial<InsertPricing>) {
  const db = await getDb();
  if (!db) return;
  
  // Recalculate landed cost if relevant fields changed
  if (pricingData.costPriceJpy || pricingData.exchangeRate || pricingData.shippingFeePerKg || pricingData.importTaxRate) {
    const existing = await getPricingById(id);
    if (existing) {
      const costJpy = Number(pricingData.costPriceJpy || existing.costPriceJpy);
      const exchangeRate = Number(pricingData.exchangeRate || existing.exchangeRate);
      const shippingFee = Number(pricingData.shippingFeePerKg || existing.shippingFeePerKg || 15);
      const taxRate = Number(pricingData.importTaxRate || existing.importTaxRate || 0.09);
      
      const costSgd = costJpy / exchangeRate;
      const landedCost = (costSgd + shippingFee) * (1 + taxRate);
      pricingData.landedCostSgd = landedCost.toFixed(2);
    }
  }
  
  await db.update(pricing).set(pricingData).where(eq(pricing.id, id));
}

export async function getCurrentPricing() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricing).where(eq(pricing.isCurrentPrice, true));
}

export async function getPricingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pricing).where(eq(pricing.id, id)).limit(1);
  return result[0];
}

export async function getPricingBySkuId(skuId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pricing)
    .where(and(eq(pricing.skuId, skuId), eq(pricing.isCurrentPrice, true)))
    .limit(1);
  return result[0];
}

export async function getPricingHistory(skuId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricing)
    .where(eq(pricing.skuId, skuId))
    .orderBy(desc(pricing.effectiveFrom));
}

// ============================================
// CLIENT PRICING FUNCTIONS
// ============================================

export async function createClientPricing(data: InsertClientPricing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientPricing).values(data);
  return result[0].insertId;
}

export async function getClientPricingByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientPricing)
    .where(and(eq(clientPricing.clientId, clientId), eq(clientPricing.isActive, true)));
}

// ============================================
// INVENTORY FUNCTIONS
// ============================================

export async function createInventory(inv: InsertInventory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inventory).values(inv);
  return result[0].insertId;
}

export async function updateInventory(id: number, inv: Partial<InsertInventory>) {
  const db = await getDb();
  if (!db) return;
  await db.update(inventory).set(inv).where(eq(inventory.id, id));
}

export async function getInventory() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventory);
}

export async function getInventoryBySkuId(skuId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inventory).where(eq(inventory.skuId, skuId)).limit(1);
  return result[0];
}

export async function getLowStockInventory() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventory)
    .where(sql`${inventory.totalStockKg} - ${inventory.allocatedStockKg} <= ${inventory.lowStockThresholdKg}`);
}

// ============================================
// INVENTORY TRANSACTION FUNCTIONS
// ============================================

export async function createInventoryTransaction(transaction: InsertInventoryTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update inventory based on transaction
  const inv = await getInventoryBySkuId(transaction.skuId);
  if (inv) {
    const currentTotal = Number(inv.totalStockKg || 0);
    const currentAllocated = Number(inv.allocatedStockKg || 0);
    const qty = Number(transaction.quantityKg);
    
    if (transaction.transactionType === 'purchase') {
      await updateInventory(inv.id, { totalStockKg: (currentTotal + qty).toFixed(3) });
    } else if (transaction.transactionType === 'sale') {
      await updateInventory(inv.id, { 
        totalStockKg: (currentTotal - qty).toFixed(3),
        allocatedStockKg: (currentAllocated - qty).toFixed(3)
      });
    } else if (transaction.transactionType === 'allocation') {
      await updateInventory(inv.id, { allocatedStockKg: (currentAllocated + qty).toFixed(3) });
    } else if (transaction.transactionType === 'deallocation') {
      await updateInventory(inv.id, { allocatedStockKg: (currentAllocated - qty).toFixed(3) });
    } else if (transaction.transactionType === 'adjustment') {
      await updateInventory(inv.id, { totalStockKg: (currentTotal + qty).toFixed(3) });
    }
  }
  
  const result = await db.insert(inventoryTransactions).values(transaction);
  return result[0].insertId;
}

export async function getInventoryTransactions(skuId?: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  if (skuId) {
    return db.select().from(inventoryTransactions)
      .where(eq(inventoryTransactions.skuId, skuId))
      .orderBy(desc(inventoryTransactions.createdAt))
      .limit(limit);
  }
  return db.select().from(inventoryTransactions)
    .orderBy(desc(inventoryTransactions.createdAt))
    .limit(limit);
}

// ============================================
// CLIENT ORDER FUNCTIONS
// ============================================

export async function createClientOrder(order: InsertClientOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientOrders).values(order);
  return result[0].insertId;
}

export async function updateClientOrder(id: number, order: Partial<InsertClientOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientOrders).set(order).where(eq(clientOrders.id, id));
}

export async function getClientOrders(filters?: { clientId?: number; status?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(clientOrders);
  const conditions = [];
  
  if (filters?.clientId) {
    conditions.push(eq(clientOrders.clientId, filters.clientId));
  }
  if (filters?.status) {
    conditions.push(eq(clientOrders.status, filters.status as any));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(desc(clientOrders.orderDate)).limit(filters?.limit || 100);
}

export async function getClientOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientOrders).where(eq(clientOrders.id, id)).limit(1);
  return result[0];
}

// ============================================
// SUPPLIER ORDER FUNCTIONS
// ============================================

export async function createSupplierOrder(order: InsertSupplierOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierOrders).values(order);
  return result[0].insertId;
}

export async function updateSupplierOrder(id: number, order: Partial<InsertSupplierOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(supplierOrders).set(order).where(eq(supplierOrders.id, id));
}

export async function getSupplierOrders(filters?: { supplierId?: number; status?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(supplierOrders);
  const conditions = [];
  
  if (filters?.supplierId) {
    conditions.push(eq(supplierOrders.supplierId, filters.supplierId));
  }
  if (filters?.status) {
    conditions.push(eq(supplierOrders.status, filters.status as any));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(desc(supplierOrders.orderDate)).limit(filters?.limit || 100);
}

// ============================================
// SUPPLIER ORDER ITEMS FUNCTIONS
// ============================================

export async function createSupplierOrderItem(item: InsertSupplierOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supplierOrderItems).values(item);
  return result[0].insertId;
}

export async function getSupplierOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supplierOrderItems).where(eq(supplierOrderItems.supplierOrderId, orderId));
}

// ============================================
// DEMAND FORECAST FUNCTIONS
// ============================================

export async function createDemandForecast(forecast: InsertDemandForecast) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(demandForecasts).values(forecast);
  return result[0].insertId;
}

export async function updateDemandForecast(id: number, forecast: Partial<InsertDemandForecast>) {
  const db = await getDb();
  if (!db) return;
  await db.update(demandForecasts).set(forecast).where(eq(demandForecasts.id, id));
}

export async function getDemandForecasts(filters?: { clientId?: number; skuId?: number; month?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(demandForecasts);
  const conditions = [];
  
  if (filters?.clientId) {
    conditions.push(eq(demandForecasts.clientId, filters.clientId));
  }
  if (filters?.skuId) {
    conditions.push(eq(demandForecasts.skuId, filters.skuId));
  }
  if (filters?.month) {
    conditions.push(eq(demandForecasts.forecastMonth, filters.month));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(desc(demandForecasts.forecastMonth));
}

// ============================================
// DATA VERSION FUNCTIONS (for rollback)
// ============================================

export async function createDataVersion(version: InsertDataVersion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dataVersions).values(version);
  return result[0].insertId;
}

export async function getDataVersions(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dataVersions)
    .where(and(eq(dataVersions.entityType, entityType), eq(dataVersions.entityId, entityId)))
    .orderBy(desc(dataVersions.versionNumber));
}

export async function getLatestDataVersion(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dataVersions)
    .where(and(eq(dataVersions.entityType, entityType), eq(dataVersions.entityId, entityId)))
    .orderBy(desc(dataVersions.versionNumber))
    .limit(1);
  return result[0];
}

// ============================================
// AI CHAT HISTORY FUNCTIONS
// ============================================

export async function createAiChatMessage(message: InsertAiChatHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiChatHistory).values(message);
  return result[0].insertId;
}

export async function getAiChatHistory(sessionId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiChatHistory)
    .where(eq(aiChatHistory.sessionId, sessionId))
    .orderBy(aiChatHistory.createdAt)
    .limit(limit);
}

export async function getUserChatSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.selectDistinct({ sessionId: aiChatHistory.sessionId })
    .from(aiChatHistory)
    .where(eq(aiChatHistory.userId, userId))
    .orderBy(desc(aiChatHistory.createdAt));
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notification);
  return result[0].insertId;
}

export async function getNotifications(userId?: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (userId) {
    conditions.push(or(eq(notifications.userId, userId), isNull(notifications.userId)));
  }
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }
  
  let query = db.select().from(notifications);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return query.orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true })
    .where(or(eq(notifications.userId, userId), isNull(notifications.userId)));
}

// ============================================
// SYSTEM SETTINGS FUNCTIONS
// ============================================

export async function getSystemSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return result[0];
}

export async function setSystemSetting(key: string, value: string, description?: string, updatedBy?: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(systemSettings)
    .values({ key, value, description, updatedBy })
    .onDuplicateKeyUpdate({ set: { value, description, updatedBy } });
}

export async function getAllSystemSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemSettings);
}

// ============================================
// ANALYTICS / AGGREGATION FUNCTIONS
// ============================================

export async function getMonthlyProfitSummary(months = 12) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    month: sql<string>`DATE_FORMAT(${clientOrders.orderDate}, '%Y-%m')`,
    totalRevenue: sql<number>`SUM(${clientOrders.totalPriceSgd})`,
    totalProfit: sql<number>`SUM(${clientOrders.profitSgd})`,
    orderCount: sql<number>`COUNT(*)`,
  })
    .from(clientOrders)
    .where(eq(clientOrders.status, 'delivered'))
    .groupBy(sql`DATE_FORMAT(${clientOrders.orderDate}, '%Y-%m')`)
    .orderBy(desc(sql`DATE_FORMAT(${clientOrders.orderDate}, '%Y-%m')`))
    .limit(months);
}

export async function getClientProfitability() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    clientId: clientOrders.clientId,
    totalRevenue: sql<number>`SUM(${clientOrders.totalPriceSgd})`,
    totalProfit: sql<number>`SUM(${clientOrders.profitSgd})`,
    totalQuantity: sql<number>`SUM(${clientOrders.quantityKg})`,
    orderCount: sql<number>`COUNT(*)`,
  })
    .from(clientOrders)
    .where(eq(clientOrders.status, 'delivered'))
    .groupBy(clientOrders.clientId)
    .orderBy(desc(sql`SUM(${clientOrders.profitSgd})`));
}

export async function getSkuProfitability() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    skuId: clientOrders.skuId,
    totalRevenue: sql<number>`SUM(${clientOrders.totalPriceSgd})`,
    totalProfit: sql<number>`SUM(${clientOrders.profitSgd})`,
    totalQuantity: sql<number>`SUM(${clientOrders.quantityKg})`,
    orderCount: sql<number>`COUNT(*)`,
  })
    .from(clientOrders)
    .where(eq(clientOrders.status, 'delivered'))
    .groupBy(clientOrders.skuId)
    .orderBy(desc(sql`SUM(${clientOrders.profitSgd})`));
}

// ============================================
// COMPREHENSIVE DATA FETCH FOR AI CONTEXT
// ============================================

export async function getBusinessContext() {
  const db = await getDb();
  if (!db) return null;
  
  const [
    suppliersList,
    clientsList,
    skusList,
    currentPricing,
    inventoryList,
    recentOrders,
    lowStock
  ] = await Promise.all([
    getSuppliers(),
    getClients(),
    getMatchaSkus(),
    getCurrentPricing(),
    getInventory(),
    getClientOrders({ limit: 20 }),
    getLowStockInventory()
  ]);
  
  return {
    suppliers: suppliersList,
    clients: clientsList,
    skus: skusList,
    pricing: currentPricing,
    inventory: inventoryList,
    recentOrders,
    lowStockAlerts: lowStock
  };
}
