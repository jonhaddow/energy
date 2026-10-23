import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('shows the newest day hour by hour, against a typical day', async ({ page }) => {
	await open(page, '/');
	await page.getByRole('link', { name: 'Now' }).click();
	await expect(page.getByRole('heading', { name: 'Thu 15 Jan' })).toBeVisible();
	await expect(page.getByText('15.0 kWh', { exact: true })).toBeVisible();
	// The typical day includes a quiet New Year's Day.
	await expect(page.getByText('29% more than a typical day (11.7 kWh)')).toBeVisible();
	// The busiest hour in the caption.
	await expect(page.locator('figcaption')).toHaveText('18:00–19:00 1.5 kWh typical 0.5 kWh');
	await page.getByRole('link', { name: 'Day before' }).click();
	await expect(page.getByRole('heading', { name: 'Wed 14 Jan' })).toBeVisible();
	await expect(page.getByText('3% more than a typical day')).toBeVisible();
});

test('compares this week with a typical one, and marks unusual days', async ({ page }) => {
	await open(page, '/now');
	const week = page.locator('.week');
	await expect(week).toContainText('Mon–Thu');
	await expect(week).toContainText('51.0 kWh · £14.81');
	await expect(week).toContainText('12% more than a typical week so far (45.6 kWh, £13.47)');
	await expect(page.getByText('under half the usual day (12.0 kWh)')).toBeVisible();
	await page.getByRole('link', { name: 'Thu 1 Jan' }).click();
	await expect(page.getByRole('heading', { name: 'Thu 1 Jan' })).toBeVisible();
	await expect(page.getByText('2.4 kWh', { exact: true })).toBeVisible();
});

test('has nothing for gas yet', async ({ page }) => {
	await open(page, '/now?fuel=gas');
	await expect(page.getByText('No readings yet')).toBeVisible();
});
