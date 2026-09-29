PRAGMA foreign_keys = ON;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `products` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`product_name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `repair_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`problem_description` text NOT NULL,
	`symptoms` text NOT NULL,
	`status` text NOT NULL,
	`safety_classification` text NOT NULL CHECK (`safety_classification` IN ('low_risk', 'moderate_risk', 'professional_recommended')),
	`difficulty` text NOT NULL CHECK (`difficulty` IN ('easy', 'moderate', 'advanced')),
	`demo_record` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `diagnostic_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_case_id` text NOT NULL,
	`sequence` integer NOT NULL CHECK (`sequence` > 0),
	`test` text NOT NULL,
	`reason` text NOT NULL,
	`expected_result` text NOT NULL,
	`observed_result` text,
	`notes` text,
	`status` text NOT NULL CHECK (`status` IN ('proposed', 'completed')),
	`created_at` text NOT NULL,
	FOREIGN KEY (`repair_case_id`) REFERENCES `repair_cases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `repair_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_case_id` text NOT NULL,
	`repair_description` text NOT NULL,
	`parts_used` text NOT NULL,
	`estimated_cost` real NOT NULL CHECK (`estimated_cost` >= 0),
	`difficulty` text NOT NULL CHECK (`difficulty` IN ('easy', 'moderate', 'advanced')),
	`created_at` text NOT NULL,
	FOREIGN KEY (`repair_case_id`) REFERENCES `repair_cases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `repair_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_case_id` text NOT NULL UNIQUE,
	`outcome` text NOT NULL CHECK (`outcome` IN ('fixed', 'improved', 'not_fixed', 'professional_repair_required', 'replacement_required', 'abandoned')),
	`final_fix` text NOT NULL,
	`actual_cost` real NOT NULL CHECK (`actual_cost` >= 0),
	`time_minutes` integer NOT NULL CHECK (`time_minutes` >= 0),
	`notes` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`repair_case_id`) REFERENCES `repair_cases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `votes` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_case_id` text NOT NULL,
	`vote_type` text NOT NULL CHECK (`vote_type` IN ('helpful', 'worked_for_me', 'did_not_work')),
	`created_at` text NOT NULL,
	FOREIGN KEY (`repair_case_id`) REFERENCES `repair_cases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `agent_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`repair_case_id` text,
	`tool_name` text NOT NULL,
	`description` text NOT NULL,
	`actor` text NOT NULL CHECK (`actor` IN ('agent', 'human')),
	`created_at` text NOT NULL,
	FOREIGN KEY (`repair_case_id`) REFERENCES `repair_cases`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `repair_cases_product_idx` ON `repair_cases` (`product_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `repair_cases_outcome_idx` ON `repair_cases` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `repair_cases_safety_idx` ON `repair_cases` (`safety_classification`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `diagnostic_steps_case_idx` ON `diagnostic_steps` (`repair_case_id`, `sequence`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `repair_attempts_case_idx` ON `repair_attempts` (`repair_case_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `votes_case_idx` ON `votes` (`repair_case_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `agent_activity_created_idx` ON `agent_activity` (`created_at`);

