-- Made-up data for the end-to-end tests: two years of monthly history.
INSERT INTO user (email, name) VALUES ('alex@example.com', 'Alex');
INSERT INTO month_history (fuel, month, kwh, cost_pence) VALUES
	('electricity', '2025-01', 300, NULL), ('electricity', '2025-02', 250, NULL),
	('electricity', '2025-03', 250, NULL), ('electricity', '2026-01', 240, NULL),
	('electricity', '2026-02', 200, NULL), ('electricity', '2026-03', 200, NULL),
	('gas', '2025-01', 2000, NULL), ('gas', '2026-01', 2200, NULL);
