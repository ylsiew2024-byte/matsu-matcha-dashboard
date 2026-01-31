/**
 * Role-Based Access Control (RBAC) System
 * 
 * Roles:
 * - super_admin: Unrestricted access to everything
 * - manager: Operational data, financial reports, staff management (no system config)
 * - employee: Inventory view/update, orders create/process (no financial, user mgmt, AI)
 * - business_client: View-only dashboard, AI predictions for their account only
 */

export type UserRole = "super_admin" | "manager" | "employee" | "business_client";

export type Permission = 
  // User Management
  | "users:view"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "users:manage_roles"
  
  // System Settings
  | "settings:view"
  | "settings:update"
  
  // Suppliers
  | "suppliers:view"
  | "suppliers:create"
  | "suppliers:update"
  | "suppliers:delete"
  
  // Clients
  | "clients:view"
  | "clients:create"
  | "clients:update"
  | "clients:delete"
  
  // Products/SKUs
  | "products:view"
  | "products:create"
  | "products:update"
  | "products:delete"
  
  // Inventory
  | "inventory:view"
  | "inventory:update"
  
  // Orders
  | "orders:view"
  | "orders:create"
  | "orders:update"
  | "orders:delete"
  
  // Pricing (Financial)
  | "pricing:view"
  | "pricing:update"
  
  // Analytics & Reports
  | "analytics:view"
  | "analytics:financial"
  
  // AI Features
  | "ai:chat"
  | "ai:predictions"
  
  // Audit Log
  | "audit:view"
  
  // Notifications
  | "notifications:view"
  | "notifications:manage";

/**
 * Permission matrix for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    // Full access to everything
    "users:view", "users:create", "users:update", "users:delete", "users:manage_roles",
    "settings:view", "settings:update",
    "suppliers:view", "suppliers:create", "suppliers:update", "suppliers:delete",
    "clients:view", "clients:create", "clients:update", "clients:delete",
    "products:view", "products:create", "products:update", "products:delete",
    "inventory:view", "inventory:update",
    "orders:view", "orders:create", "orders:update", "orders:delete",
    "pricing:view", "pricing:update",
    "analytics:view", "analytics:financial",
    "ai:chat", "ai:predictions",
    "audit:view",
    "notifications:view", "notifications:manage",
  ],
  
  manager: [
    // Operational data, financial reports, staff management (no system config)
    "users:view", // Can view users but not manage roles
    "suppliers:view", "suppliers:create", "suppliers:update",
    "clients:view", "clients:create", "clients:update",
    "products:view", "products:create", "products:update",
    "inventory:view", "inventory:update",
    "orders:view", "orders:create", "orders:update", "orders:delete",
    "pricing:view", "pricing:update",
    "analytics:view", "analytics:financial",
    "ai:chat",
    "audit:view",
    "notifications:view",
  ],
  
  employee: [
    // Restricted: inventory view/update, orders create/process
    // No financial data, user management, or AI analytics
    "suppliers:view",
    "clients:view",
    "products:view",
    "inventory:view", "inventory:update",
    "orders:view", "orders:create", "orders:update",
    "notifications:view",
  ],
  
  business_client: [
    // View-only dashboard, AI predictions for their account only
    "analytics:view", // Limited to their own data
    "ai:predictions", // AI Usage Predictions
    "notifications:view",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Role hierarchy for display purposes
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: "Super Admin",
  manager: "Manager",
  employee: "Employee",
  business_client: "Business Client",
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: "Unrestricted access to all features. Can manage users, system settings, and delete any record.",
  manager: "Access to operational data, financial reports, and staff management. Cannot change system-wide configurations.",
  employee: "Restricted operational access. Can view/update inventory and create/process orders. No access to financial data, user management, or AI analytics.",
  business_client: "External client with view-only dashboard access. Can see AI Usage Predictions and analytics for their account only.",
};

/**
 * Navigation items configuration with required permissions
 */
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  permissions: Permission[];
  badge?: string;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/", permissions: [] }, // Everyone can see dashboard
  { id: "clients", label: "Clients", icon: "Users", path: "/clients", permissions: ["clients:view"] },
  { id: "suppliers", label: "Suppliers", icon: "Building2", path: "/suppliers", permissions: ["suppliers:view"] },
  { id: "products", label: "Products", icon: "Package", path: "/products", permissions: ["products:view"] },
  { id: "pricing", label: "Pricing", icon: "DollarSign", path: "/pricing", permissions: ["pricing:view"] },
  { id: "inventory", label: "Inventory", icon: "Warehouse", path: "/inventory", permissions: ["inventory:view"] },
  { id: "orders", label: "Orders", icon: "ShoppingCart", path: "/orders", permissions: ["orders:view"] },
  { id: "analytics", label: "Analytics", icon: "BarChart3", path: "/analytics", permissions: ["analytics:view"] },
  { id: "ai-chat", label: "AI Assistant", icon: "MessageSquare", path: "/ai-chat", permissions: ["ai:chat"] },
  { id: "ai-predictions", label: "AI Predictions", icon: "Brain", path: "/ai-predictions", permissions: ["ai:predictions"] },
  { id: "audit-log", label: "Audit Log", icon: "FileText", path: "/audit-log", permissions: ["audit:view"], badge: "Log" },
  { id: "users", label: "User Management", icon: "UserCog", path: "/users", permissions: ["users:view"] },
  { id: "settings", label: "Settings", icon: "Settings", path: "/settings", permissions: ["settings:view"] },
];

/**
 * Get navigation items visible to a specific role
 */
export function getVisibleNavItems(role: UserRole): NavItem[] {
  return NAVIGATION_ITEMS.filter(item => {
    // If no permissions required, everyone can see it
    if (item.permissions.length === 0) return true;
    // Check if user has any of the required permissions
    return hasAnyPermission(role, item.permissions);
  });
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(role: UserRole, path: string): boolean {
  const navItem = NAVIGATION_ITEMS.find(item => item.path === path);
  if (!navItem) return true; // Unknown routes are allowed (will 404)
  if (navItem.permissions.length === 0) return true;
  return hasAnyPermission(role, navItem.permissions);
}
