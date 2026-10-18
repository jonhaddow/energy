import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('prices a quote on our year of use, against what we pay now', async ({ page }) => {
	await open(page, '/');
	await page.getByRole('link', { name: 'Quotes' }).click();
	await expect(page.getByText('1,990 kWh of electricity and 7,700 kWh of gas')).toBeVisible();
	// Now: 1,990 × 26.1p + 7,700 × 6p + 365 × (51.2p + 30p) = £1,278.
	await expect(page.getByRole('listitem').filter({ hasText: 'What we pay now' })).toContainText(
		'£1,278'
	);
	await page.getByLabel('Name').fill('Cheap Fixed');
	const form = page.locator('form.add');
	for (const [fuel, unit, standing] of [
		['Electricity', '20', '50'],
		['Gas', '5', '30']
	]) {
		const group = form.getByRole('group', { name: fuel });
		await group.getByLabel('Unit rate').fill(unit);
		await group.getByLabel('Standing').fill(standing);
	}
	await page.getByRole('button', { name: 'Add' }).click();
	// 1,990 × 20p + 7,700 × 5p + 365 × 80p = £1,075: £203 less.
	const quote = page.getByRole('listitem').filter({ hasText: 'Cheap Fixed' });
	await expect(quote).toContainText('£1,075');
	await expect(quote).toContainText('£203 less a year');
	await page.getByRole('button', { name: 'Remove Cheap Fixed' }).click();
	await expect(quote).toBeHidden();
});
