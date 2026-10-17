// Monthly totals from before the meter data starts (the old Google Sheet), as SQL
// for the month_history table. Input: a CSV of fuel,month,kwh,cost_pounds
// (cost may be blank), kept out of git in private/.
// Usage: node scripts/history.ts private/history.csv > private/history.sql
//        npx wrangler d1 execute energy --local --file=private/history.sql   (or --remote)
import { readFileSync } from 'node:fs';

const [, , file] = process.argv;
if (!file) throw new Error('Usage: node scripts/history.ts <file.csv>');
const lines = readFileSync(file, 'utf8').trim().split('\n').slice(1);
const values = lines.map((line) => {
	const [fuel, month, kwh, cost] = line.split(',').map((s) => s.trim());
	if (!['electricity', 'gas'].includes(fuel) || !/^\d{4}-\d{2}$/.test(month) || !(Number(kwh) >= 0))
		throw new Error(`Bad row: ${line}`);
	const pence = cost ? Math.round(Number(cost) * 100) : 'NULL';
	return `('${fuel}', '${month}', ${Number(kwh)}, ${pence})`;
});
console.log(
	`INSERT INTO month_history (fuel, month, kwh, cost_pence) VALUES\n${values.join(',\n')}\n` +
		'ON CONFLICT (fuel, month) DO UPDATE SET kwh = excluded.kwh, cost_pence = excluded.cost_pence;'
);
