import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('compares this year with last year', async ({ page }) => {
	await open(page, '/');
	await expect(page.getByText('Jan–Mar 2026')).toBeVisible();
	await expect(page.getByText('640 kWh')).toBeVisible();
	await expect(page.getByText('20% less than 2025')).toBeVisible();
	await expect(page.getByRole('row', { name: 'Feb 200 250' })).toBeVisible();
});

test('switches to gas', async ({ page }) => {
	await open(page, '/');
	await page.getByRole('link', { name: 'Gas' }).click();
	await expect(page.getByText('10% more than 2025')).toBeVisible();
});
