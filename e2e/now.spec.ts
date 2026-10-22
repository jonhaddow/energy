import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('shows the newest day hour by hour, against a typical day', async ({ page }) => {
	await open(page, '/');
	await page.getByRole('link', { name: 'Now' }).click();
	await expect(page.getByRole('heading', { name: 'Thu 15 Jan' })).toBeVisible();
	await expect(page.getByText('15.0 kWh')).toBeVisible();
	await expect(page.getByText('25% more than a typical day (12.0 kWh)')).toBeVisible();
	// The busiest hour in the caption.
	await expect(page.locator('figcaption')).toHaveText('18:00–19:00 1.5 kWh typical 0.5 kWh');
	await page.getByRole('link', { name: 'Day before' }).click();
	await expect(page.getByRole('heading', { name: 'Wed 14 Jan' })).toBeVisible();
	await expect(page.getByText('About the same as a typical day')).toBeVisible();
});

test('has nothing for gas yet', async ({ page }) => {
	await open(page, '/now?fuel=gas');
	await expect(page.getByText('No readings yet')).toBeVisible();
});
