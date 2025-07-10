
// tradetaper-frontend/tests/e2e/psychological-profiler.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AI Psychological Profiler', () => {
  test('should analyze note and display psychological tags', async ({ page }) => {
    // Mock the backend API response for note analysis
    await page.route('**/api/v1/notes/*/analyze', async route => {
      const json = ['FOMO', 'Overconfidence'];
      await route.fulfill({ json });
    });

    // Navigate to a trade detail page (assuming it has notes and an analyze button)
    // For this E2E test, we'll assume a trade with ID 'trade-with-note' exists and has a note.
    // In a real scenario, you might create a trade with a note via API before running the test.
    await page.goto('/journal'); // Go to journal page

    // Click on a trade to open its preview drawer
    // This assumes there's a trade in the table that can be clicked.
    // For a robust test, you might need to create a trade with a note first.
    await page.locator('text=EURUSD').first().click(); // Click on the first EURUSD trade

    // Wait for the drawer to open
    await page.waitForSelector('text=Notes & Analysis');

    // Click the 'Analyze Note' button
    await page.locator('button:has-text("Analyze Note")').click();

    // Wait for analysis to complete and tags to appear
    await page.waitForSelector('text=FOMO');
    await page.waitForSelector('text=Overconfidence');

    // Assert that the tags are displayed
    await expect(page.locator('text=FOMO')).toBeVisible();
    await expect(page.locator('text=Overconfidence')).toBeVisible();

    // Optionally, close the drawer
    await page.locator('button[aria-label="Remove image"]').click(); // Assuming this is the close button
  });
});
