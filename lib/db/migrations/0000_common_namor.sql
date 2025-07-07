CREATE TABLE "agent_errors" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"agent_run_id" varchar(255) NOT NULL,
	"step" varchar(50) NOT NULL,
	"error_type" varchar(100),
	"error_message" text NOT NULL,
	"error_details" json,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"repository_id" varchar(255) NOT NULL,
	"task" text NOT NULL,
	"run_id" varchar(255) NOT NULL,
	"assistant_id" varchar(255) NOT NULL,
	"thread_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "edited_files" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"agent_run_id" varchar(255) NOT NULL,
	"plan_item_id" varchar(255),
	"file_path" varchar(1024) NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"original_content" text,
	"new_content" text,
	"content_hash" varchar(64),
	"edited_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indexed_files" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"agent_run_id" varchar(255) NOT NULL,
	"file_path" varchar(1024) NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"chunk_count" integer DEFAULT 0,
	"embedding_stored" boolean DEFAULT false,
	"indexed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_items" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"agent_run_id" varchar(255) NOT NULL,
	"file_path" varchar(1024) NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"description" text,
	"priority" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"executed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"agent_run_id" varchar(255) NOT NULL,
	"pr_number" integer,
	"pr_url" varchar(512),
	"title" varchar(255),
	"body" text,
	"base_branch" varchar(100),
	"head_branch" varchar(100),
	"status" varchar(20) DEFAULT 'open',
	"merged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "semantic_searches" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"agent_run_id" varchar(255) NOT NULL,
	"query_text" text NOT NULL,
	"relevant_files" json,
	"similarity_scores" json,
	"searched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" varchar(255) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"user_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_hashes" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"merkle_tree_id" varchar(255) NOT NULL,
	"file_path" varchar(512) NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"file_size" bigint,
	"last_modified" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_merkle_tree_file" UNIQUE("merkle_tree_id","file_path")
);
--> statement-breakpoint
CREATE TABLE "merkle_trees" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"repository_id" varchar(255) NOT NULL,
	"root_hash" varchar(64) NOT NULL,
	"tree_structure" json,
	"file_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"url" varchar(512) NOT NULL,
	"name" varchar(255) NOT NULL,
	"base_branch" varchar(100) DEFAULT 'main',
	"current_merkle_root" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_url_branch" UNIQUE("url","base_branch")
);
--> statement-breakpoint
CREATE TABLE "sandbox_instances" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"agent_run_id" varchar(255) NOT NULL,
	"sandbox_id" varchar(100) NOT NULL,
	"runtime" varchar(50),
	"vcpus" integer DEFAULT 1,
	"memory_mb" integer,
	"timeout_minutes" integer DEFAULT 5,
	"status" varchar(20) DEFAULT 'initializing',
	"domain" varchar(255),
	"ports" json,
	"stopped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_errors" ADD CONSTRAINT "agent_errors_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edited_files" ADD CONSTRAINT "edited_files_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edited_files" ADD CONSTRAINT "edited_files_plan_item_id_plan_items_id_fk" FOREIGN KEY ("plan_item_id") REFERENCES "public"."plan_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indexed_files" ADD CONSTRAINT "indexed_files_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semantic_searches" ADD CONSTRAINT "semantic_searches_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_hashes" ADD CONSTRAINT "file_hashes_merkle_tree_id_merkle_trees_id_fk" FOREIGN KEY ("merkle_tree_id") REFERENCES "public"."merkle_trees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merkle_trees" ADD CONSTRAINT "merkle_trees_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_instances" ADD CONSTRAINT "sandbox_instances_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_error_agent_run" ON "agent_errors" USING btree ("agent_run_id");--> statement-breakpoint
CREATE INDEX "idx_error_step" ON "agent_errors" USING btree ("step");--> statement-breakpoint
CREATE INDEX "idx_error_occurred_at" ON "agent_errors" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_repository_agent_run" ON "agent_runs" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "idx_agent_runs_thread_id" ON "agent_runs" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "idx_edited_agent_run" ON "edited_files" USING btree ("agent_run_id");--> statement-breakpoint
CREATE INDEX "idx_edited_plan_item" ON "edited_files" USING btree ("plan_item_id");--> statement-breakpoint
CREATE INDEX "idx_indexed_agent_run" ON "indexed_files" USING btree ("agent_run_id");--> statement-breakpoint
CREATE INDEX "idx_indexed_file_hash" ON "indexed_files" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "idx_indexed_files_embedding" ON "indexed_files" USING btree ("embedding_stored");--> statement-breakpoint
CREATE INDEX "idx_plan_agent_run" ON "plan_items" USING btree ("agent_run_id");--> statement-breakpoint
CREATE INDEX "idx_plan_status" ON "plan_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pr_agent_run" ON "pull_requests" USING btree ("agent_run_id");--> statement-breakpoint
CREATE INDEX "idx_pr_status" ON "pull_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_semantic_agent_run" ON "semantic_searches" USING btree ("agent_run_id");--> statement-breakpoint
CREATE INDEX "idx_account_user_id" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_account_provider_account" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "idx_session_token" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_session_user_id" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_session_expires_at" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_merkle_tree" ON "file_hashes" USING btree ("merkle_tree_id");--> statement-breakpoint
CREATE INDEX "idx_file_hashes_hash" ON "file_hashes" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "idx_repo_root" ON "merkle_trees" USING btree ("repository_id","root_hash");--> statement-breakpoint
CREATE INDEX "idx_merkle_trees_created_at" ON "merkle_trees" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_repositories_updated_at" ON "repositories" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_sandbox_agent_run" ON "sandbox_instances" USING btree ("agent_run_id");--> statement-breakpoint
CREATE INDEX "idx_sandbox_id" ON "sandbox_instances" USING btree ("sandbox_id");