CREATE TABLE `quote` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`electricity_unit_pence` real NOT NULL,
	`electricity_standing_pence` real NOT NULL,
	`gas_unit_pence` real NOT NULL,
	`gas_standing_pence` real NOT NULL,
	`fixed_until` text
);
