CREATE TABLE `ai_chat_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_chat_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`action` varchar(100) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`previousData` json,
	`newData` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`skuId` int NOT NULL,
	`quantityKg` decimal(12,3) NOT NULL,
	`unitPriceSgd` decimal(12,2) NOT NULL,
	`totalPriceSgd` decimal(12,2) NOT NULL,
	`profitSgd` decimal(12,2),
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`deliveryDate` timestamp,
	`status` enum('pending','confirmed','delivered','cancelled') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `client_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`skuId` int NOT NULL,
	`customSellingPrice` decimal(12,2),
	`discountPercent` decimal(5,2) DEFAULT '0',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`businessType` varchar(100),
	`contactName` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`address` text,
	`specialDiscount` decimal(5,2) DEFAULT '0',
	`paymentTerms` varchar(100),
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	`updatedBy` int,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`data` json NOT NULL,
	`changeDescription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`createdByName` varchar(255),
	CONSTRAINT `data_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `demand_forecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int,
	`skuId` int,
	`forecastMonth` varchar(7) NOT NULL,
	`projectedDemandKg` decimal(12,3) NOT NULL,
	`actualDemandKg` decimal(12,3),
	`confidenceLevel` decimal(5,2),
	`aiGenerated` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `demand_forecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skuId` int NOT NULL,
	`totalStockKg` decimal(12,3) DEFAULT '0',
	`allocatedStockKg` decimal(12,3) DEFAULT '0',
	`lowStockThresholdKg` decimal(12,3) DEFAULT '5',
	`lastOrderDate` timestamp,
	`lastArrivalDate` timestamp,
	`nextExpectedArrival` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryId` int NOT NULL,
	`skuId` int NOT NULL,
	`transactionType` enum('purchase','sale','adjustment','allocation','deallocation') NOT NULL,
	`quantityKg` decimal(12,3) NOT NULL,
	`referenceType` varchar(50),
	`referenceId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	CONSTRAINT `inventory_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matcha_skus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`grade` enum('ceremonial','premium','culinary','food_grade') NOT NULL,
	`qualityTier` int DEFAULT 3,
	`isSeasonal` boolean DEFAULT false,
	`harvestSeason` varchar(50),
	`description` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	`updatedBy` int,
	CONSTRAINT `matcha_skus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`type` enum('low_stock','price_change','profitability_alert','order_reminder','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`severity` enum('info','warning','critical') DEFAULT 'info',
	`isRead` boolean DEFAULT false,
	`entityType` varchar(100),
	`entityId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skuId` int NOT NULL,
	`costPriceJpy` decimal(12,2) NOT NULL,
	`exchangeRate` decimal(10,4) NOT NULL,
	`shippingFeePerKg` decimal(10,2) DEFAULT '15.00',
	`importTaxRate` decimal(5,4) DEFAULT '0.09',
	`landedCostSgd` decimal(12,2),
	`sellingPricePerKg` decimal(12,2) NOT NULL,
	`effectiveFrom` timestamp NOT NULL DEFAULT (now()),
	`effectiveTo` timestamp,
	`isCurrentPrice` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	`updatedBy` int,
	CONSTRAINT `pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierOrderId` int NOT NULL,
	`skuId` int NOT NULL,
	`quantityKg` decimal(12,3) NOT NULL,
	`unitPriceJpy` decimal(12,2) NOT NULL,
	`totalPriceJpy` decimal(14,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplier_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`expectedArrivalDate` timestamp,
	`actualArrivalDate` timestamp,
	`totalCostJpy` decimal(14,2),
	`totalCostSgd` decimal(14,2),
	`exchangeRateUsed` decimal(10,4),
	`status` enum('draft','submitted','confirmed','shipped','arrived','cancelled') DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `supplier_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`country` varchar(100) DEFAULT 'Japan',
	`region` varchar(255),
	`contactName` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`leadTimeDays` int DEFAULT 30,
	`orderCadenceDays` int DEFAULT 45,
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	`updatedBy` int,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','operations','finance','view_only') NOT NULL DEFAULT 'view_only';