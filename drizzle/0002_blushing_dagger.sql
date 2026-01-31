ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','manager','employee','business_client') NOT NULL DEFAULT 'employee';--> statement-breakpoint
ALTER TABLE `users` ADD `linkedClientId` int;