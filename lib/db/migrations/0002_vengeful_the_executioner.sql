CREATE TABLE `agent_errors` (
	`id` varchar(255) NOT NULL,
	`agent_run_id` varchar(255) NOT NULL,
	`step` varchar(50) NOT NULL,
	`error_type` varchar(100),
	`error_message` text NOT NULL,
	`error_details` json,
	`occurred_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_errors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_runs` (
	`id` varchar(255) NOT NULL,
	`repository_id` varchar(255) NOT NULL,
	`task` text NOT NULL,
	`current_step` varchar(50) NOT NULL,
	`status` varchar(20) DEFAULT 'running',
	`merkle_root` varchar(64),
	`sandbox_id` varchar(100),
	`branch_name` varchar(255),
	`pr_url` varchar(512),
	`commit_hash` varchar(40),
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `edited_files` (
	`id` varchar(255) NOT NULL,
	`agent_run_id` varchar(255) NOT NULL,
	`plan_item_id` varchar(255),
	`file_path` varchar(1024) NOT NULL,
	`action_type` varchar(50) NOT NULL,
	`original_content` text,
	`new_content` text,
	`content_hash` varchar(64),
	`edited_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edited_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `indexed_files` (
	`id` varchar(255) NOT NULL,
	`agent_run_id` varchar(255) NOT NULL,
	`file_path` varchar(1024) NOT NULL,
	`file_hash` varchar(64) NOT NULL,
	`chunk_count` int DEFAULT 0,
	`embedding_stored` boolean DEFAULT false,
	`indexed_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `indexed_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_items` (
	`id` varchar(255) NOT NULL,
	`agent_run_id` varchar(255) NOT NULL,
	`file_path` varchar(1024) NOT NULL,
	`action_type` varchar(50) NOT NULL,
	`description` text,
	`priority` int DEFAULT 0,
	`status` varchar(20) DEFAULT 'pending',
	`executed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plan_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pull_requests` (
	`id` varchar(255) NOT NULL,
	`agent_run_id` varchar(255) NOT NULL,
	`pr_number` int,
	`pr_url` varchar(512),
	`title` varchar(255),
	`body` text,
	`base_branch` varchar(100),
	`head_branch` varchar(100),
	`status` varchar(20) DEFAULT 'open',
	`merged_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pull_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `semantic_searches` (
	`id` varchar(255) NOT NULL,
	`agent_run_id` varchar(255) NOT NULL,
	`query_text` text NOT NULL,
	`relevant_files` json,
	`similarity_scores` json,
	`searched_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `semantic_searches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_hashes` (
	`id` varchar(255) NOT NULL,
	`merkle_tree_id` varchar(255) NOT NULL,
	`file_path` varchar(1024) NOT NULL,
	`file_hash` varchar(64) NOT NULL,
	`file_size` bigint,
	`last_modified` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_hashes_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_merkle_tree_file` UNIQUE(`merkle_tree_id`,`file_hash`)
);
--> statement-breakpoint
CREATE TABLE `merkle_trees` (
	`id` varchar(255) NOT NULL,
	`repository_id` varchar(255) NOT NULL,
	`root_hash` varchar(64) NOT NULL,
	`tree_structure` json,
	`file_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `merkle_trees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `repositories` (
	`id` varchar(255) NOT NULL,
	`url` varchar(512) NOT NULL,
	`name` varchar(255) NOT NULL,
	`base_branch` varchar(100) DEFAULT 'main',
	`current_merkle_root` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `repositories_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_url` UNIQUE(`url`)
);
--> statement-breakpoint
CREATE TABLE `sandbox_instances` (
	`id` varchar(255) NOT NULL,
	`agent_run_id` varchar(255) NOT NULL,
	`sandbox_id` varchar(100) NOT NULL,
	`runtime` varchar(50),
	`vcpus` int DEFAULT 1,
	`memory_mb` int,
	`timeout_minutes` int DEFAULT 5,
	`status` varchar(20) DEFAULT 'initializing',
	`domain` varchar(255),
	`ports` json,
	`stopped_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sandbox_instances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agent_errors` ADD CONSTRAINT `agent_errors_agent_run_id_agent_runs_id_fk` FOREIGN KEY (`agent_run_id`) REFERENCES `agent_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_runs` ADD CONSTRAINT `agent_runs_repository_id_repositories_id_fk` FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `edited_files` ADD CONSTRAINT `edited_files_agent_run_id_agent_runs_id_fk` FOREIGN KEY (`agent_run_id`) REFERENCES `agent_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `edited_files` ADD CONSTRAINT `edited_files_plan_item_id_plan_items_id_fk` FOREIGN KEY (`plan_item_id`) REFERENCES `plan_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `indexed_files` ADD CONSTRAINT `indexed_files_agent_run_id_agent_runs_id_fk` FOREIGN KEY (`agent_run_id`) REFERENCES `agent_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_items` ADD CONSTRAINT `plan_items_agent_run_id_agent_runs_id_fk` FOREIGN KEY (`agent_run_id`) REFERENCES `agent_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pull_requests` ADD CONSTRAINT `pull_requests_agent_run_id_agent_runs_id_fk` FOREIGN KEY (`agent_run_id`) REFERENCES `agent_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `semantic_searches` ADD CONSTRAINT `semantic_searches_agent_run_id_agent_runs_id_fk` FOREIGN KEY (`agent_run_id`) REFERENCES `agent_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `file_hashes` ADD CONSTRAINT `file_hashes_merkle_tree_id_merkle_trees_id_fk` FOREIGN KEY (`merkle_tree_id`) REFERENCES `merkle_trees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merkle_trees` ADD CONSTRAINT `merkle_trees_repository_id_repositories_id_fk` FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sandbox_instances` ADD CONSTRAINT `sandbox_instances_agent_run_id_agent_runs_id_fk` FOREIGN KEY (`agent_run_id`) REFERENCES `agent_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_error_agent_run` ON `agent_errors` (`agent_run_id`);--> statement-breakpoint
CREATE INDEX `idx_error_step` ON `agent_errors` (`step`);--> statement-breakpoint
CREATE INDEX `idx_error_occurred_at` ON `agent_errors` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_repository_status` ON `agent_runs` (`repository_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_agent_runs_started_at` ON `agent_runs` (`started_at`);--> statement-breakpoint
CREATE INDEX `idx_agent_runs_completed_at` ON `agent_runs` (`completed_at`);--> statement-breakpoint
CREATE INDEX `idx_edited_agent_run` ON `edited_files` (`agent_run_id`);--> statement-breakpoint
CREATE INDEX `idx_edited_plan_item` ON `edited_files` (`plan_item_id`);--> statement-breakpoint
CREATE INDEX `idx_indexed_agent_run` ON `indexed_files` (`agent_run_id`);--> statement-breakpoint
CREATE INDEX `idx_indexed_file_hash` ON `indexed_files` (`file_hash`);--> statement-breakpoint
CREATE INDEX `idx_indexed_files_embedding` ON `indexed_files` (`embedding_stored`);--> statement-breakpoint
CREATE INDEX `idx_plan_agent_run` ON `plan_items` (`agent_run_id`);--> statement-breakpoint
CREATE INDEX `idx_plan_status` ON `plan_items` (`status`);--> statement-breakpoint
CREATE INDEX `idx_pr_agent_run` ON `pull_requests` (`agent_run_id`);--> statement-breakpoint
CREATE INDEX `idx_pr_status` ON `pull_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_semantic_agent_run` ON `semantic_searches` (`agent_run_id`);--> statement-breakpoint
CREATE INDEX `idx_merkle_tree` ON `file_hashes` (`merkle_tree_id`);--> statement-breakpoint
CREATE INDEX `idx_file_path` ON `file_hashes` (`file_path`);--> statement-breakpoint
CREATE INDEX `idx_file_hashes_hash` ON `file_hashes` (`file_hash`);--> statement-breakpoint
CREATE INDEX `idx_repo_root` ON `merkle_trees` (`repository_id`,`root_hash`);--> statement-breakpoint
CREATE INDEX `idx_merkle_trees_created_at` ON `merkle_trees` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_repositories_updated_at` ON `repositories` (`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_sandbox_agent_run` ON `sandbox_instances` (`agent_run_id`);--> statement-breakpoint
CREATE INDEX `idx_sandbox_id` ON `sandbox_instances` (`sandbox_id`);