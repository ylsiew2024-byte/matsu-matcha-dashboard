import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock('./db', () => ({
  getSuppliers: vi.fn().mockResolvedValue([
    { id: 1, name: 'Kyoto Matcha Co', country: 'Japan', region: 'Kyoto', isActive: true },
    { id: 2, name: 'Uji Premium', country: 'Japan', region: 'Uji', isActive: true },
  ]),
  getClients: vi.fn().mockResolvedValue([
    { id: 1, name: 'Cafe Zen', businessType: 'cafe', isActive: true },
    { id: 2, name: 'Tea House', businessType: 'retail', isActive: true },
  ]),
  getMatchaSkus: vi.fn().mockResolvedValue([
    { id: 1, name: 'Premium Ceremonial', grade: 'ceremonial', supplierId: 1, isActive: true },
    { id: 2, name: 'Culinary Grade', grade: 'culinary', supplierId: 2, isActive: true },
  ]),
  getCurrentPricing: vi.fn().mockResolvedValue([
    { id: 1, skuId: 1, costPriceJpy: '5000', exchangeRate: '0.009', landedCostSgd: '50', sellingPricePerKg: '80' },
  ]),
  getInventory: vi.fn().mockResolvedValue([
    { id: 1, skuId: 1, totalStockKg: '100', allocatedStockKg: '20', lowStockThresholdKg: '10' },
  ]),
  getLowStockInventory: vi.fn().mockResolvedValue([]),
  getClientOrders: vi.fn().mockResolvedValue([
    { id: 1, clientId: 1, skuId: 1, quantityKg: '5', totalPriceSgd: '400', status: 'delivered' },
  ]),
  getAuditLogs: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, action: 'create', entityType: 'client', createdAt: new Date() },
  ]),
  getNotifications: vi.fn().mockResolvedValue([
    { id: 1, title: 'Low Stock Alert', severity: 'warning', isRead: false, createdAt: new Date() },
  ]),
  getDemandForecasts: vi.fn().mockResolvedValue([]),
  getDataVersions: vi.fn().mockResolvedValue([]),
  getUsers: vi.fn().mockResolvedValue([
    { id: 1, name: 'Admin User', role: 'super_admin' },
  ]),
  getAllUsers: vi.fn().mockResolvedValue([
    { id: 1, name: 'Admin User', role: 'super_admin' },
  ]),
  getDataVersionHistory: vi.fn().mockResolvedValue([]),
  getMonthlyProfitSummary: vi.fn().mockResolvedValue([]),
  getClientProfitability: vi.fn().mockResolvedValue([]),
  getSkuProfitability: vi.fn().mockResolvedValue([]),
  getBusinessContext: vi.fn().mockResolvedValue({
    suppliers: [],
    clients: [],
    skus: [],
    pricing: [],
    inventory: [],
    recentOrders: [],
    lowStockAlerts: [],
  }),
  getAiChatHistory: vi.fn().mockResolvedValue([]),
  getUserChatSessions: vi.fn().mockResolvedValue([]),
  createAuditLog: vi.fn().mockResolvedValue(1),
  createSupplier: vi.fn().mockResolvedValue(1),
  createClient: vi.fn().mockResolvedValue(1),
  createMatchaSku: vi.fn().mockResolvedValue(1),
  createPricing: vi.fn().mockResolvedValue(1),
  createClientOrder: vi.fn().mockResolvedValue(1),
  createNotification: vi.fn().mockResolvedValue(1),
  createAiChatMessage: vi.fn().mockResolvedValue(1),
  createDataVersion: vi.fn().mockResolvedValue(1),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@matsumatcha.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "super_admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createOperationsContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "ops-user",
    email: "ops@matsumatcha.com",
    name: "Operations User",
    loginMethod: "manus",
    role: "manager",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createViewOnlyContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 3,
    openId: "viewer-user",
    email: "viewer@matsumatcha.com",
    name: "View Only User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Matsu Matcha B2B Dashboard", () => {
  describe("Authentication & Authorization", () => {
    it("returns current user info for authenticated requests", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.me();
      
      expect(result).toBeDefined();
      expect(result?.name).toBe("Admin User");
      expect(result?.role).toBe("super_admin");
    });

    it("clears session cookie on logout", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.logout();
      
      expect(result).toEqual({ success: true });
      expect(ctx.res.clearCookie).toHaveBeenCalled();
    });
  });

  describe("Suppliers Management", () => {
    it("lists all active suppliers", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const suppliers = await caller.suppliers.list({});
      
      expect(suppliers).toHaveLength(2);
      expect(suppliers[0].name).toBe("Kyoto Matcha Co");
    });
  });

  describe("Clients Management", () => {
    it("lists all active clients", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const clients = await caller.clients.list({});
      
      expect(clients).toHaveLength(2);
      expect(clients[0].name).toBe("Cafe Zen");
    });
  });

  describe("Products (SKUs) Management", () => {
    it("lists all matcha SKUs", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const skus = await caller.skus.list({});
      
      expect(skus).toHaveLength(2);
      expect(skus[0].grade).toBe("ceremonial");
    });
  });

  describe("Pricing Management", () => {
    it("retrieves current pricing data", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const pricing = await caller.pricing.current();
      
      expect(pricing).toHaveLength(1);
      expect(pricing[0].costPriceJpy).toBe("5000");
    });
  });

  describe("Inventory Management", () => {
    it("lists all inventory items", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const inventory = await caller.inventory.list();
      
      expect(inventory).toHaveLength(1);
      expect(inventory[0].totalStockKg).toBe("100");
    });

    it("identifies low stock items", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const lowStock = await caller.inventory.lowStock();
      
      expect(lowStock).toHaveLength(0);
    });
  });

  describe("Orders Management", () => {
    it("lists client orders", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const orders = await caller.clientOrders.list({});
      
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe("delivered");
    });
  });

  describe("Audit Logging", () => {
    it("admin can view audit logs", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const logs = await caller.auditLogs.list({});
      
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe("create");
    });
  });

  describe("Notifications", () => {
    it("lists user notifications", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const notifications = await caller.notifications.list({});
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].severity).toBe("warning");
    });

    it("marks notification as read", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.notifications.markRead({ id: 1 });
      
      expect(result).toEqual({ success: true });
    });

    it("marks all notifications as read", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.notifications.markAllRead();
      
      expect(result).toEqual({ success: true });
    });
  });

  describe("Analytics", () => {
    it("retrieves monthly profit summary", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const summary = await caller.analytics.monthlyProfit({});
      
      expect(summary).toBeDefined();
    });

    it("retrieves SKU profitability", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const profitability = await caller.analytics.skuProfitability();
      
      expect(profitability).toBeDefined();
    });

    it("retrieves client profitability", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const profitability = await caller.analytics.clientProfitability();
      
      expect(profitability).toBeDefined();
    });
  });

  describe("Demand Forecasting", () => {
    it("lists demand forecasts", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const forecasts = await caller.forecasts.list({});
      
      expect(forecasts).toBeDefined();
    });
  });

  describe("Version Control", () => {
    it("lists data versions for a specific entity", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const versions = await caller.versions.list({ entityType: 'supplier', entityId: 1 });
      
      expect(versions).toBeDefined();
    });
  });

  describe("User Management", () => {
    it("admin can list users", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const users = await caller.users.list();
      
      expect(users).toHaveLength(1);
    });
  });

  describe("AI Chat", () => {
    it("retrieves chat history for a session", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const history = await caller.ai.history({ sessionId: "test-session" });
      
      expect(history).toBeDefined();
    });

    it("retrieves user chat sessions", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      
      const sessions = await caller.ai.sessions();
      
      expect(sessions).toBeDefined();
    });
  });
});

describe("Role-Based Access Control", () => {
  it("operations user can access suppliers", async () => {
    const ctx = createOperationsContext();
    const caller = appRouter.createCaller(ctx);
    
    const suppliers = await caller.suppliers.list({});
    
    expect(suppliers).toBeDefined();
  });

  it("view-only user can read suppliers", async () => {
    const ctx = createViewOnlyContext();
    const caller = appRouter.createCaller(ctx);
    
    const suppliers = await caller.suppliers.list({});
    
    expect(suppliers).toBeDefined();
  });
});
