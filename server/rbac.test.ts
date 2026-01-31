import { describe, expect, it } from "vitest";
import { 
  hasPermission, 
  canAccessRoute, 
  ROLE_PERMISSIONS,
  getVisibleNavItems,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  type UserRole,
  type Permission
} from "../shared/rbac";

describe("RBAC Permission System", () => {
  describe("Role Permissions", () => {
    it("super_admin has all permissions", () => {
      const role: UserRole = "super_admin";
      expect(hasPermission(role, "users:manage_roles")).toBe(true);
      expect(hasPermission(role, "settings:update")).toBe(true);
      expect(hasPermission(role, "pricing:view")).toBe(true);
      expect(hasPermission(role, "analytics:financial")).toBe(true);
      expect(hasPermission(role, "ai:predictions")).toBe(true);
      expect(hasPermission(role, "audit:view")).toBe(true);
    });

    it("manager has operational permissions but not system settings", () => {
      const role: UserRole = "manager";
      expect(hasPermission(role, "pricing:view")).toBe(true);
      expect(hasPermission(role, "pricing:update")).toBe(true);
      expect(hasPermission(role, "inventory:view")).toBe(true);
      expect(hasPermission(role, "inventory:update")).toBe(true);
      expect(hasPermission(role, "analytics:financial")).toBe(true);
      expect(hasPermission(role, "ai:chat")).toBe(true);
      // Should NOT have
      expect(hasPermission(role, "users:manage_roles")).toBe(false);
      expect(hasPermission(role, "settings:update")).toBe(false);
      expect(hasPermission(role, "ai:predictions")).toBe(false);
    });

    it("employee has restricted operational access only", () => {
      const role: UserRole = "employee";
      expect(hasPermission(role, "inventory:view")).toBe(true);
      expect(hasPermission(role, "inventory:update")).toBe(true);
      expect(hasPermission(role, "orders:view")).toBe(true);
      expect(hasPermission(role, "orders:create")).toBe(true);
      expect(hasPermission(role, "orders:update")).toBe(true);
      // Should NOT have
      expect(hasPermission(role, "pricing:view")).toBe(false);
      expect(hasPermission(role, "analytics:financial")).toBe(false);
      expect(hasPermission(role, "users:view")).toBe(false);
      expect(hasPermission(role, "ai:chat")).toBe(false);
      expect(hasPermission(role, "ai:predictions")).toBe(false);
    });

    it("business_client has view-only access with AI predictions", () => {
      const role: UserRole = "business_client";
      expect(hasPermission(role, "ai:predictions")).toBe(true);
      expect(hasPermission(role, "analytics:view")).toBe(true);
      expect(hasPermission(role, "notifications:view")).toBe(true);
      // Should NOT have
      expect(hasPermission(role, "pricing:view")).toBe(false);
      expect(hasPermission(role, "inventory:update")).toBe(false);
      expect(hasPermission(role, "users:view")).toBe(false);
    });
  });

  describe("Route Access Control", () => {
    it("super_admin can access all routes", () => {
      const role: UserRole = "super_admin";
      expect(canAccessRoute(role, "/")).toBe(true);
      expect(canAccessRoute(role, "/clients")).toBe(true);
      expect(canAccessRoute(role, "/pricing")).toBe(true);
      expect(canAccessRoute(role, "/analytics")).toBe(true);
      expect(canAccessRoute(role, "/ai-predictions")).toBe(true);
      expect(canAccessRoute(role, "/settings")).toBe(true);
    });

    it("manager can access operational routes but not AI predictions", () => {
      const role: UserRole = "manager";
      expect(canAccessRoute(role, "/")).toBe(true);
      expect(canAccessRoute(role, "/clients")).toBe(true);
      expect(canAccessRoute(role, "/pricing")).toBe(true);
      expect(canAccessRoute(role, "/analytics")).toBe(true);
      // Limited access
      expect(canAccessRoute(role, "/ai-predictions")).toBe(false);
    });

    it("employee can access inventory and orders", () => {
      const role: UserRole = "employee";
      expect(canAccessRoute(role, "/")).toBe(true);
      expect(canAccessRoute(role, "/inventory")).toBe(true);
      expect(canAccessRoute(role, "/orders")).toBe(true);
      // Should NOT access
      expect(canAccessRoute(role, "/pricing")).toBe(false);
      expect(canAccessRoute(role, "/ai-predictions")).toBe(false);
    });

    it("business_client can access dashboard and AI predictions", () => {
      const role: UserRole = "business_client";
      expect(canAccessRoute(role, "/")).toBe(true);
      expect(canAccessRoute(role, "/ai-predictions")).toBe(true);
      expect(canAccessRoute(role, "/analytics")).toBe(true); // Limited view
      // Should NOT access
      expect(canAccessRoute(role, "/clients")).toBe(false);
      expect(canAccessRoute(role, "/suppliers")).toBe(false);
      expect(canAccessRoute(role, "/pricing")).toBe(false);
      expect(canAccessRoute(role, "/inventory")).toBe(false);
    });
  });

  describe("Navigation Visibility", () => {
    it("super_admin sees all navigation items", () => {
      const navItems = getVisibleNavItems("super_admin");
      expect(navItems.length).toBeGreaterThan(10);
      expect(navItems.some(item => item.id === "ai-predictions")).toBe(true);
      expect(navItems.some(item => item.id === "settings")).toBe(true);
      expect(navItems.some(item => item.id === "users")).toBe(true);
    });

    it("employee sees limited navigation items", () => {
      const navItems = getVisibleNavItems("employee");
      expect(navItems.some(item => item.id === "dashboard")).toBe(true);
      expect(navItems.some(item => item.id === "inventory")).toBe(true);
      expect(navItems.some(item => item.id === "orders")).toBe(true);
      // Should NOT see
      expect(navItems.some(item => item.id === "pricing")).toBe(false);
      expect(navItems.some(item => item.id === "ai-predictions")).toBe(false);
      expect(navItems.some(item => item.id === "settings")).toBe(false);
    });

    it("business_client sees minimal navigation items", () => {
      const navItems = getVisibleNavItems("business_client");
      expect(navItems.some(item => item.id === "dashboard")).toBe(true);
      expect(navItems.some(item => item.id === "ai-predictions")).toBe(true);
      expect(navItems.some(item => item.id === "analytics")).toBe(true);
      // Should NOT see
      expect(navItems.some(item => item.id === "clients")).toBe(false);
      expect(navItems.some(item => item.id === "suppliers")).toBe(false);
      expect(navItems.some(item => item.id === "pricing")).toBe(false);
    });
  });

  describe("Permission Helpers", () => {
    it("hasAnyPermission returns true if role has any of the permissions", () => {
      expect(hasAnyPermission("employee", ["pricing:view", "inventory:view"])).toBe(true);
      expect(hasAnyPermission("employee", ["pricing:view", "settings:update"])).toBe(false);
    });

    it("hasAllPermissions returns true only if role has all permissions", () => {
      expect(hasAllPermissions("super_admin", ["pricing:view", "inventory:view"])).toBe(true);
      expect(hasAllPermissions("employee", ["inventory:view", "orders:view"])).toBe(true);
      expect(hasAllPermissions("employee", ["inventory:view", "pricing:view"])).toBe(false);
    });

    it("getRolePermissions returns all permissions for a role", () => {
      const superAdminPerms = getRolePermissions("super_admin");
      const employeePerms = getRolePermissions("employee");
      
      expect(superAdminPerms.length).toBeGreaterThan(employeePerms.length);
      expect(superAdminPerms).toContain("users:manage_roles");
      expect(employeePerms).not.toContain("users:manage_roles");
    });
  });

  describe("Role Display Names and Descriptions", () => {
    it("all roles have display names", () => {
      expect(ROLE_DISPLAY_NAMES.super_admin).toBe("Super Admin");
      expect(ROLE_DISPLAY_NAMES.manager).toBe("Manager");
      expect(ROLE_DISPLAY_NAMES.employee).toBe("Employee");
      expect(ROLE_DISPLAY_NAMES.business_client).toBe("Business Client");
    });

    it("all roles have descriptions", () => {
      expect(ROLE_DESCRIPTIONS.super_admin).toContain("Unrestricted");
      expect(ROLE_DESCRIPTIONS.manager).toContain("operational");
      expect(ROLE_DESCRIPTIONS.employee).toContain("Restricted");
      expect(ROLE_DESCRIPTIONS.business_client).toContain("view-only");
    });
  });

  describe("AI Predictions Access", () => {
    it("only super_admin and business_client can access AI predictions", () => {
      expect(hasPermission("super_admin", "ai:predictions")).toBe(true);
      expect(hasPermission("business_client", "ai:predictions")).toBe(true);
      expect(hasPermission("manager", "ai:predictions")).toBe(false);
      expect(hasPermission("employee", "ai:predictions")).toBe(false);
    });
  });

  describe("Financial Data Access", () => {
    it("only super_admin and manager can view financial analytics", () => {
      expect(hasPermission("super_admin", "analytics:financial")).toBe(true);
      expect(hasPermission("manager", "analytics:financial")).toBe(true);
      expect(hasPermission("employee", "analytics:financial")).toBe(false);
      expect(hasPermission("business_client", "analytics:financial")).toBe(false);
    });

    it("only super_admin and manager can view/update pricing", () => {
      expect(hasPermission("super_admin", "pricing:view")).toBe(true);
      expect(hasPermission("super_admin", "pricing:update")).toBe(true);
      expect(hasPermission("manager", "pricing:view")).toBe(true);
      expect(hasPermission("manager", "pricing:update")).toBe(true);
      expect(hasPermission("employee", "pricing:view")).toBe(false);
      expect(hasPermission("business_client", "pricing:view")).toBe(false);
    });
  });
});
