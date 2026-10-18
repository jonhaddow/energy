import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

test('compares this year with last year', async ({ page }) => {
	await open(page, '/');
	await expect(page.getByText('Jan–Mar 2026')).toBeVisible();
	await expect(page.getByText('640 kWh')).toBeVisible();
	await expect(page.getByText('20% less than a year before')).toBeVisible();
	// February in the chart's caption: x ≈ 39 of its 340 wide.
	const chart = page.getByRole('img', { name: /Use each month/ });
	const { width } = (await chart.boundingBox())!;
	await chart.hover({ position: { x: (width * 39) / 340, y: 20 } });
	await expect(page.locator('figcaption li')).toHaveText(['2026 200 kWh', '2025 250 kWh']);
});

test('switches to gas', async ({ page }) => {
	await open(page, '/');
	await page.getByRole('link', { name: 'Gas' }).click();
	await expect(page.getByText('10% more than a year before')).toBeVisible();
	// But January was 20% colder.
	await expect(page.getByText('Allowing for the weather: 8% less gas')).toBeVisible();
	await expect(page.getByText('(it was 20% colder)')).toBeVisible();
});

test('shows pounds, and both fuels together', async ({ page }) => {
	await open(page, '/');
	await page.getByRole('link', { name: '£' }).click();
	await expect(page.getByText('£207')).toBeVisible();
	await expect(page.getByText('16% less than a year before')).toBeVisible();
	// The same prices both years, so all of it is from using less.
	await expect(page.getByRole('listitem').filter({ hasText: 'Using less' })).toHaveText(
		'Using less −£40'
	);
	await expect(page.getByText('Higher prices')).toBeHidden();
	await expect(page.getByText('Standing charges: £187 a year')).toBeVisible();
	// The chart marks April's new prices; the caption names them for that month.
	const chart = page.getByRole('img', { name: /Use each month/ });
	const { width, height } = (await chart.boundingBox())!;
	// April is at x ≈ 97 of the chart's 340 wide (YearChart's W and PAD). Halfway
	// down, as the caption's extra line moves the chart down.
	await chart.hover({ position: { x: (width * 100) / 340, y: height / 2 } });
	await expect(page.getByText('New prices from 1 Apr 2026')).toBeVisible();
	await page.getByRole('link', { name: 'Both' }).click();
	await expect(page).toHaveURL(/fuel=both&unit=gbp/);
	await expect(page.getByText('£218').first()).toBeVisible();
	await expect(page.getByText('1% less than a year before')).toBeVisible();
});
