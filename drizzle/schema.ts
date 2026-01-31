import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

// ============================================
// USER & AUTHENTICATION
// ============================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "operations", "finance", "view_only"]).default("view_only").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// AUDIT LOG
// ============================================

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(), // CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT
  entityType: varchar("entityType", { length: 100 }).notNull(), // supplier, client, sku, inventory, etc.
  entityId: int("entityId"),
  previousData: json("previousData"),
  newData: json("newData"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================
// SUPPLIERS
// ============================================

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }).default("Japan"),
  region: varchar("region", { length: 255 }), // e.g., Uji, Nishio, Kagoshima
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  leadTimeDays: int("leadTimeDays").default(30), // typical lead time for orders
  orderCadenceDays: int("orderCadenceDays").default(45), // how often we order (1-2 months)
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
  updatedBy: int("updatedBy"),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ============================================
// CLIENTS
// ============================================

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  businessType: varchar("businessType", { length: 100 }), // cafe, restaurant, retailer
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  address: text("address"),
  specialDiscount: decimal("specialDiscount", { precision: 5, scale: 2 }).default("0"), // percentage
  paymentTerms: varchar("paymentTerms", { length: 100 }), // NET30, COD, etc.
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
  updatedBy: int("updatedBy"),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ============================================
// MATCHA SKUs
// ============================================

export const matchaSkus = mysqlTable("matcha_skus", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  grade: mysqlEnum("grade", ["ceremonial", "premium", "culinary", "food_grade"]).notNull(),
  qualityTier: int("qualityTier").default(3), // 1-5 scale, 5 being highest
  isSeasonal: boolean("isSeasonal").default(false),
  harvestSeason: varchar("harvestSeason", { length: 50 }), // spring, summer, etc.
  description: text("description"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
  updatedBy: int("updatedBy"),
});

export type MatchaSku = typeof matchaSkus.$inferSelect;
export type InsertMatchaSku = typeof matchaSkus.$inferInsert;

// ============================================
// PRICING (Cost & Selling Prices)
// ============================================

export const pricing = mysqlTable("pricing", {
  id: int("id").autoincrement().primaryKey(),
  skuId: int("skuId").notNull(),
  costPriceJpy: decimal("costPriceJpy", { precision: 12, scale: 2 }).notNull(), // per kg in JPY
  exchangeRate: decimal("exchangeRate", { precision: 10, scale: 4 }).notNull(), // JPY to SGD
  shippingFeePerKg: decimal("shippingFeePerKg", { precision: 10, scale: 2 }).default("15.00"), // SGD
  importTaxRate: decimal("importTaxRate", { precision: 5, scale: 4 }).default("0.09"), // 9%
  // Calculated fields stored for performance
  landedCostSgd: decimal("landedCostSgd", { precision: 12, scale: 2 }), // auto-calculated
  sellingPricePerKg: decimal("sellingPricePerKg", { precision: 12, scale: 2 }).notNull(), // SGD
  effectiveFrom: timestamp("effectiveFrom").defaultNow().notNull(),
  effectiveTo: timestamp("effectiveTo"),
  isCurrentPrice: boolean("isCurrentPrice").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
  updatedBy: int("updatedBy"),
});

export type Pricing = typeof pricing.$inferSelect;
export type InsertPricing = typeof pricing.$inferInsert;

// ============================================
// CLIENT PRICING (Special pricing per client)
// ============================================

export const clientPricing = mysqlTable("client_pricing", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  skuId: int("skuId").notNull(),
  customSellingPrice: decimal("customSellingPrice", { precision: 12, scale: 2 }), // override price
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientPricing = typeof clientPricing.$inferSelect;
export type InsertClientPricing = typeof clientPricing.$inferInsert;

// ============================================
// INVENTORY
// ============================================

export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  skuId: int("skuId").notNull(),
  totalStockKg: decimal("totalStockKg", { precision: 12, scale: 3 }).default("0"),
  allocatedStockKg: decimal("allocatedStockKg", { precision: 12, scale: 3 }).default("0"),
  // unallocatedStockKg is calculated as totalStockKg - allocatedStockKg
  lowStockThresholdKg: decimal("lowStockThresholdKg", { precision: 12, scale: 3 }).default("5"),
  lastOrderDate: timestamp("lastOrderDate"),
  lastArrivalDate: timestamp("lastArrivalDate"),
  nextExpectedArrival: timestamp("nextExpectedArrival"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

// ============================================
// INVENTORY TRANSACTIONS (for tracking changes)
// ============================================

export const inventoryTransactions = mysqlTable("inventory_transactions", {
  id: int("id").autoincrement().primaryKey(),
  inventoryId: int("inventoryId").notNull(),
  skuId: int("skuId").notNull(),
  transactionType: mysqlEnum("transactionType", ["purchase", "sale", "adjustment", "allocation", "deallocation"]).notNull(),
  quantityKg: decimal("quantityKg", { precision: 12, scale: 3 }).notNull(), // positive or negative
  referenceType: varchar("referenceType", { length: 50 }), // order, client_order, manual
  referenceId: int("referenceId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
});

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;

// ============================================
// CLIENT ORDERS (Monthly purchases)
// ============================================

export const clientOrders = mysqlTable("client_orders", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  skuId: int("skuId").notNull(),
  quantityKg: decimal("quantityKg", { precision: 12, scale: 3 }).notNull(),
  unitPriceSgd: decimal("unitPriceSgd", { precision: 12, scale: 2 }).notNull(),
  totalPriceSgd: decimal("totalPriceSgd", { precision: 12, scale: 2 }).notNull(),
  profitSgd: decimal("profitSgd", { precision: 12, scale: 2 }),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  deliveryDate: timestamp("deliveryDate"),
  status: mysqlEnum("status", ["pending", "confirmed", "delivered", "cancelled"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type ClientOrder = typeof clientOrders.$inferSelect;
export type InsertClientOrder = typeof clientOrders.$inferInsert;

// ============================================
// SUPPLIER ORDERS (Purchase orders to Japan)
// ============================================

export const supplierOrders = mysqlTable("supplier_orders", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  expectedArrivalDate: timestamp("expectedArrivalDate"),
  actualArrivalDate: timestamp("actualArrivalDate"),
  totalCostJpy: decimal("totalCostJpy", { precision: 14, scale: 2 }),
  totalCostSgd: decimal("totalCostSgd", { precision: 14, scale: 2 }),
  exchangeRateUsed: decimal("exchangeRateUsed", { precision: 10, scale: 4 }),
  status: mysqlEnum("status", ["draft", "submitted", "confirmed", "shipped", "arrived", "cancelled"]).default("draft"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type SupplierOrder = typeof supplierOrders.$inferSelect;
export type InsertSupplierOrder = typeof supplierOrders.$inferInsert;

// ============================================
// SUPPLIER ORDER ITEMS
// ============================================

export const supplierOrderItems = mysqlTable("supplier_order_items", {
  id: int("id").autoincrement().primaryKey(),
  supplierOrderId: int("supplierOrderId").notNull(),
  skuId: int("skuId").notNull(),
  quantityKg: decimal("quantityKg", { precision: 12, scale: 3 }).notNull(),
  unitPriceJpy: decimal("unitPriceJpy", { precision: 12, scale: 2 }).notNull(),
  totalPriceJpy: decimal("totalPriceJpy", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupplierOrderItem = typeof supplierOrderItems.$inferSelect;
export type InsertSupplierOrderItem = typeof supplierOrderItems.$inferInsert;

// ============================================
// DEMAND FORECASTS
// ============================================

export const demandForecasts = mysqlTable("demand_forecasts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId"),
  skuId: int("skuId"),
  forecastMonth: varchar("forecastMonth", { length: 7 }).notNull(), // YYYY-MM format
  projectedDemandKg: decimal("projectedDemandKg", { precision: 12, scale: 3 }).notNull(),
  actualDemandKg: decimal("actualDemandKg", { precision: 12, scale: 3 }),
  confidenceLevel: decimal("confidenceLevel", { precision: 5, scale: 2 }), // 0-100%
  aiGenerated: boolean("aiGenerated").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DemandForecast = typeof demandForecasts.$inferSelect;
export type InsertDemandForecast = typeof demandForecasts.$inferInsert;

// ============================================
// DATA VERSIONS (for rollback functionality)
// ============================================

export const dataVersions = mysqlTable("data_versions", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  data: json("data").notNull(), // snapshot of the entity
  changeDescription: text("changeDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
  createdByName: varchar("createdByName", { length: 255 }),
});

export type DataVersion = typeof dataVersions.$inferSelect;
export type InsertDataVersion = typeof dataVersions.$inferInsert;

// ============================================
// AI CHAT HISTORY
// ============================================

export const aiChatHistory = mysqlTable("ai_chat_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"), // for storing context, tokens used, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiChatHistory = typeof aiChatHistory.$inferSelect;
export type InsertAiChatHistory = typeof aiChatHistory.$inferInsert;

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null means all users
  type: mysqlEnum("type", ["low_stock", "price_change", "profitability_alert", "order_reminder", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info"),
  isRead: boolean("isRead").default(false),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================
// SYSTEM SETTINGS
// ============================================

export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
