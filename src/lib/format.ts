const whole = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const tenths = new Intl.NumberFormat('en-GB', {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});
const percent = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0 });
const pounds = new Intl.NumberFormat('en-GB', {
	style: 'currency',
	currency: 'GBP',
	maximumFractionDigits: 0
});
const poundsAndPence = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

/** "1,234 kWh" */
export const formatKwh = (kwh: number) => `${whole.format(kwh)} kWh`;

/** "8.4 kWh": a day or an hour's use. */
export const formatSmallKwh = (kwh: number) => `${tenths.format(kwh)} kWh`;

/** "£2.35" */
export const formatPence = (pence: number) => poundsAndPence.format(pence / 100);

/** "£1,234" for 123400 pence. */
export const formatPounds = (pence: number) => pounds.format(pence / 100);

/** "12%" (no sign: the words around it say which way). */
export const formatPercent = (fraction: number) => percent.format(Math.abs(fraction));
