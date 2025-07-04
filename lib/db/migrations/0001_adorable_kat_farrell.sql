ALTER TABLE `account` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `account_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `provider_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `user_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `token` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `ip_address` varchar(45);--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `user_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `identifier` varchar(255) NOT NULL;