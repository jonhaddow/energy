const whole = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0 });
const pounds = new Intl.NumberFormat('en-GB', {
	style: 'currency',
	currency: 'GBP',
	maximumFractionDigits: 0
});

/** "1,234 kWh" */
export const formatKwh = (kwh: number) => `${whole.format(kwh)} kWh`;

/** "1,234 kWh" or "£1,234". */
export const formatAmount = (value: number, unit: 'kwh' | 'gbp') =>
	unit === 'kwh' ? formatKwh(value) : pounds.format(value);

/** "12%" (no sign: the words around it say which way). */
export const formatPercent = (fraction: number) => percent.format(Math.abs(fraction));
