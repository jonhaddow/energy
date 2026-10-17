import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('adds and removes prices', async ({ page }) => {
	await open(page, '/settings');
	await page.getByRole('radiogroup', { name: 'Fuel' }).getByText('Gas').click();
	await page.getByLabel('From').fill('2026-10-01');
	await page.getByLabel('Unit rate').fill('6.12');
	await page.getByLabel('Standing charge').fill('31.4');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByText('6.12p/kWh · 31.4p/day')).toBeVisible();
	await page.getByRole('button', { name: 'Remove Gas from 1 Oct 2026' }).click();
	await expect(page.getByText('6.12p/kWh')).toBeHidden();
});
