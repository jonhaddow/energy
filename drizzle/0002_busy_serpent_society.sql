CREATE TABLE `location` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weather_day` (
	`day` text PRIMARY KEY NOT NULL,
	`mean_c` real NOT NULL
);
