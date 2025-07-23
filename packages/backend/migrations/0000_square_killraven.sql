CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`completed` integer DEFAULT false NOT NULL,
	`due_date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text,
	`slug` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `todos_slug_unique` ON `todos` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_todos_user_id` ON `todos` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_todos_completed` ON `todos` (`completed`);--> statement-breakpoint
CREATE INDEX `idx_todos_due_date` ON `todos` (`due_date`);--> statement-breakpoint
CREATE INDEX `idx_todos_created_at` ON `todos` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_todos_deleted_at` ON `todos` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `idx_todos_slug` ON `todos` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_todos_user_slug` ON `todos` (`user_id`,`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_created_at` ON `users` (`created_at`);