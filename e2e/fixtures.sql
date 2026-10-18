-- Made-up data for the end-to-end tests: two years of monthly history.
INSERT INTO user (email, name) VALUES ('alex@example.com', 'Alex');
INSERT INTO month_history (fuel, month, kwh, cost_pence) VALUES
	('electricity', '2025-01', 300, NULL), ('electricity', '2025-02', 250, NULL),
	('electricity', '2025-03', 250, NULL), ('electricity', '2026-01', 240, NULL),
	('electricity', '2026-02', 200, NULL), ('electricity', '2026-03', 200, NULL),
	('gas', '2025-01', 2000, NULL), ('gas', '2026-01', 2200, NULL);
INSERT INTO tariff (fuel, "from", unit_pence, standing_pence) VALUES
	('electricity', '2025-01-01', 24.86, 53.35), ('electricity', '2026-04-01', 26.1, 51.2),
	('gas', '2025-01-01', 6, 30);
INSERT INTO location (id, name, latitude, longitude) VALUES (1, 'Swansea, Wales', 51.62, -3.94);
-- January 2026 20% colder than January 2025 (12 degree days a day against 10).
INSERT INTO weather_day (day, mean_c)
	WITH RECURSIVE d(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM d WHERE n < 31)
	SELECT printf('2025-01-%02d', n), 5.5 FROM d
	UNION ALL SELECT printf('2026-01-%02d', n), 3.5 FROM d;
-- A whole year of both fuels, for quotes: electricity Apr 2025 – Mar 2026 (1,990 kWh),
-- gas Feb 2025 – Jan 2026 (7,700 kWh).
INSERT INTO month_history (fuel, month, kwh, cost_pence)
	WITH RECURSIVE m(n) AS (SELECT 2 UNION ALL SELECT n + 1 FROM m WHERE n < 12)
	SELECT 'electricity', printf('2025-%02d', n), 150, NULL FROM m WHERE n >= 4
	UNION ALL SELECT 'gas', printf('2025-%02d', n), 500, NULL FROM m;
