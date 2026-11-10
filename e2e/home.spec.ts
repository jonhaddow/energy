import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

// Readings to Thu 15 Jan 2026: 12 kWh of electricity a day (2.4 on 1 Jan, 15 on
// 15 Jan) and 72 of gas. January 2025 is the sheet's: 300 kWh of electricity, 2,000 of gas.

test('compares this month so far with a year before, in £', async ({ page }) => {
	await open(page, '/');
	const month = page.locator('.month');
	await expect(month.getByRole('heading')).toHaveText('January so far');
	// Electricity: 173.4 kWh × 24.86p + 15 × 53.35p = £51.11; gas: 1,080 × 6p + 15 × 30p = £69.30.
	await expect(month.locator('.big')).toHaveText('£120');
	// A year before: 15/31 of January's history, at the same prices: £106.65.
	await expect(month).toContainText('↑ £14 more than 1–15 Jan last year');
	// January 2026 was 20% colder.
	await expect(month).toContainText('20% colder; allowing for that, 7% less gas');
});

test('shows yesterday, and taps through to its hours', async ({ page }) => {
	await open(page, '/');
	const day = page.locator('.yesterday');
	await expect(day).toContainText('Thu 15 Jan');
	await expect(day).toContainText('Electricity £4.26 · Gas £4.62');
	await expect(day).toContainText('about usual');
	await day.click();
	await expect(page.getByRole('heading', { name: 'Thu 15 Jan' })).toBeVisible();
});

test('shows a month from the chart', async ({ page }) => {
	await open(page, '/');
	const caption = page.locator('.caption');
	await expect(caption).toContainText('January 2026 £218');
	await page.getByRole('button', { name: 'March 2025' }).click();
	await expect(caption).toContainText('March 2025');
});
