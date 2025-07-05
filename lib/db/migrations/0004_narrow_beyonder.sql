ALTER TABLE `repositories` DROP INDEX `unique_url`;--> statement-breakpoint
ALTER TABLE `repositories` ADD CONSTRAINT `unique_url_branch` UNIQUE(`url`,`base_branch`);