CREATE TABLE `tariff` (
	`fuel` text NOT NULL,
	`from` text NOT NULL,
	`unit_pence` real NOT NULL,
	`standing_pence` real NOT NULL,
	PRIMARY KEY(`fuel`, `from`)
);
