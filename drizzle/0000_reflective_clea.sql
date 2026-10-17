CREATE TABLE `backfill` (
	`fuel` text PRIMARY KEY NOT NULL,
	`done_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `month_history` (
	`fuel` text NOT NULL,
	`month` text NOT NULL,
	`kwh` real NOT NULL,
	`cost_pence` integer,
	PRIMARY KEY(`fuel`, `month`)
);
--> statement-breakpoint
CREATE TABLE `reading` (
	`fuel` text NOT NULL,
	`start` integer NOT NULL,
	`day` text NOT NULL,
	`wh` integer NOT NULL,
	PRIMARY KEY(`fuel`, `start`)
);
--> statement-breakpoint
CREATE INDEX `reading_day_idx` ON `reading` (`fuel`,`day`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `sync_status` (
	`id` integer PRIMARY KEY NOT NULL,
	`last_run_at` text NOT NULL,
	`last_error` text
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);