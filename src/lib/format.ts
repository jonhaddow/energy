const whole = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0 });

/** "1,234 kWh" */
export const formatKwh = (kwh: number) => `${whole.format(kwh)} kWh`;

/** "12%" (no sign: the words around it say which way). */
export const formatPercent = (fraction: number) => percent.format(Math.abs(fraction));
