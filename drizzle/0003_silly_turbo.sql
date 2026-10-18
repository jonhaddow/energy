CREATE TABLE `typical_use` (
	`fuel` text PRIMARY KEY NOT NULL,
	`low` integer NOT NULL,
	`medium` integer NOT NULL,
	`high` integer NOT NULL
);
--> statement-breakpoint
-- Ofgem's TDCVs from 1 July 2026 (single-rate electricity).
INSERT INTO `typical_use` (`fuel`, `low`, `medium`, `high`) VALUES ('electricity', 1600, 2500, 3800), ('gas', 6000, 9500, 14000);
