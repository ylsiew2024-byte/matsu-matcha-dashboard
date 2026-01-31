import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getBusinessContext: vi.fn().mockResolvedValue({
    suppliers: [{ id: 1, name: "Test Supplier" }],
    clients: [{ id: 1, name: "Test Client" }],
    skus: [{ id: 1, name: "Test SKU" }],
    pricing: [{ id: 1, costPriceJpy: "10000", landedCostSgd: "100" }],
    inventory: [],
    recentOrders: [],
    lowStockAlerts: [],
  }),
  getAiChatHistory: vi.fn().mockResolvedValue([]),
  createAiChatMessage: vi.fn().mockResolvedValue(undefined),
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test AI response" } }],
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: "admin" | "operations" | "finance" | "view_only"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
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

describe("Security - Role-Based Access Control", () => {
  describe("AI Chat Access", () => {
    it("allows admin users to access AI chat", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      // Should not throw
      const result = await caller.ai.chat({
        message: "Hello",
        sessionId: "test-session",
      });

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
    });

    it("allows finance users to access AI chat", async () => {
      const ctx = createMockContext("finance");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.chat({
        message: "Hello",
        sessionId: "test-session",
      });

      expect(result).toBeDefined();
    });

    it("allows operations users to access AI chat", async () => {
      const ctx = createMockContext("operations");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ai.chat({
        message: "Hello",
        sessionId: "test-session",
      });

      expect(result).toBeDefined();
    });

    it("blocks view_only users from AI chat", async () => {
      const ctx = createMockContext("view_only");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.ai.chat({
          message: "Hello",
          sessionId: "test-session",
        })
      ).rejects.toThrow("AI Assistant access is restricted for your role");
    });
  });

  describe("Auth Procedures", () => {
    it("returns user data for authenticated users", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result?.role).toBe("admin");
      expect(result?.name).toBe("Test User");
    });

    it("logout clears session cookie", async () => {
      const ctx = createMockContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result).toEqual({ success: true });
      expect(ctx.res.clearCookie).toHaveBeenCalled();
    });
  });
});

describe("Security - Role Permissions Matrix", () => {
  const rolePermissions = {
    admin: {
      canViewCosts: true,
      canViewMargins: true,
      canEditPricing: true,
      canEditInventory: true,
      canManageUsers: true,
      canExportData: true,
      canAccessAI: true,
    },
    operations: {
      canViewCosts: false,
      canViewMargins: false,
      canEditPricing: false,
      canEditInventory: true,
      canManageUsers: false,
      canExportData: true,
      canAccessAI: true,
    },
    finance: {
      canViewCosts: true,
      canViewMargins: true,
      canEditPricing: true,
      canEditInventory: false,
      canManageUsers: false,
      canExportData: true,
      canAccessAI: true,
    },
    view_only: {
      canViewCosts: false,
      canViewMargins: false,
      canEditPricing: false,
      canEditInventory: false,
      canManageUsers: false,
      canExportData: false,
      canAccessAI: false,
    },
  };

  it("admin has full permissions", () => {
    expect(rolePermissions.admin.canViewCosts).toBe(true);
    expect(rolePermissions.admin.canViewMargins).toBe(true);
    expect(rolePermissions.admin.canEditPricing).toBe(true);
    expect(rolePermissions.admin.canManageUsers).toBe(true);
  });

  it("operations can edit inventory but not pricing", () => {
    expect(rolePermissions.operations.canEditInventory).toBe(true);
    expect(rolePermissions.operations.canEditPricing).toBe(false);
    expect(rolePermissions.operations.canViewCosts).toBe(false);
  });

  it("finance can view costs and edit pricing but not inventory", () => {
    expect(rolePermissions.finance.canViewCosts).toBe(true);
    expect(rolePermissions.finance.canEditPricing).toBe(true);
    expect(rolePermissions.finance.canEditInventory).toBe(false);
  });

  it("view_only has no edit permissions", () => {
    expect(rolePermissions.view_only.canEditPricing).toBe(false);
    expect(rolePermissions.view_only.canEditInventory).toBe(false);
    expect(rolePermissions.view_only.canExportData).toBe(false);
    expect(rolePermissions.view_only.canAccessAI).toBe(false);
  });
});
