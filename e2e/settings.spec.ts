import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('adds and removes prices', async ({ page }) => {
	await open(page, '/settings');
	await page.getByRole('radiogroup', { name: 'Fuel' }).getByText('Gas').click();
	await page.getByLabel('From', { exact: true }).fill('2026-10-01');
	await page.getByLabel('Unit rate').fill('6.12');
	await page.getByLabel('Standing charge').fill('31.4');
	await page.getByRole('button', { name: 'Save', exact: true }).click();
	await expect(page.getByText('6.12p/kWh · 31.4p/day')).toBeVisible();
	await page.getByRole('button', { name: 'Remove Gas from 1 Oct 2026' }).click();
	await expect(page.getByText('6.12p/kWh')).toBeHidden();
});

test('shows the location', async ({ page }) => {
	await open(page, '/settings');
	await expect(page.getByText('Now: Swansea, Wales.')).toBeVisible();
	await expect(page.getByLabel('Town')).toHaveValue('Swansea');
});

test('edits the other homes figures', async ({ page }) => {
	await open(page, '/settings');
	const gas = page.getByRole('group', { name: 'Gas' });
	await gas.getByLabel('High').fill('9000');
	await page.getByRole('button', { name: 'Save figures' }).click();
	await expect(page.getByRole('alert')).toHaveText('Whole kWh, low to high');
	await gas.getByLabel('High').fill('15000');
	await page.getByRole('button', { name: 'Save figures' }).click();
	await page.reload();
	await expect(page.getByRole('group', { name: 'Gas' }).getByLabel('High')).toHaveValue('15000');
});
