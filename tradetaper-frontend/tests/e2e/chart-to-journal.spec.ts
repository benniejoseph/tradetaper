
// tradetaper-frontend/tests/e2e/chart-to-journal.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Automated Chart-to-Journal Entry', () => {
  test('should populate trade form from chart analysis', async ({ page }) => {
    // Mock the backend API response for chart analysis
    await page.route('**/api/v1/trades/analyze-chart', async route => {
      const json = {
        symbol: 'XAUUSD',
        direction: 'Long',
        entryPrice: 1900.50,
        exitPrice: 1910.25,
        stopLoss: 1895.00,
        takeProfit: 1915.00,
      };
      await route.fulfill({ json });
    });

    // Navigate to the trade form page
    await page.goto('/journal/new'); // Assuming this is the path to the trade form

    // Click the "Upload Chart" button (which is now ChartUploadButton)
    await page.locator('text=Upload Chart').click();

    // Select a dummy file (Playwright doesn't execute actual file upload, just simulates selection)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Upload Chart').click(); // Click again to trigger file input
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-chart.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake image data'),
    });

    // Wait for the form to be populated (assuming some loading state or debounce)
    await page.waitForTimeout(2000); // Adjust as needed

    // Assert that form fields are populated
    await expect(page.locator('#symbol')).toHaveValue('XAUUSD');
    await expect(page.locator('#direction')).toHaveValue('Long');
    await expect(page.locator('#entryPrice')).toHaveValue('1900.5');
    await expect(page.locator('#exitPrice')).toHaveValue('1910.25');
    await expect(page.locator('#stopLoss')).toHaveValue('1895');
    await expect(page.locator('#takeProfit')).toHaveValue('1915');

    // Optionally, submit the form and verify success (requires more setup)
    // await page.locator('button[type="submit"]').click();
    // await expect(page.locator('text=Trade created successfully')).toBeVisible();
  });
});
