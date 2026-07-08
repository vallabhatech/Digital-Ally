import { test, expect } from '@playwright/test';

test.describe('Digital Ally E2E Website Generation Flow', () => {
  test('should successfully go through the generation flow in local-only mode', async ({ page }) => {
    // 1. Visit page
    await page.goto('/');

    // 2. Accept privacy modal - select "Use local-only mode"
    const localModeBtn = page.getByRole('button', { name: 'Use local-only mode' });
    await expect(localModeBtn).toBeVisible();
    await localModeBtn.click();

    // Verify modal is gone
    await expect(localModeBtn).not.toBeVisible();

    // 3. Fill details step (locks/unlocks are dynamic)
    // Step 1: Fill name, business, email, phone
    await page.getByPlaceholder('Your Name').fill('John Doe');
    await page.getByPlaceholder('Your Business Name').fill('John Bakery');
    await page.getByPlaceholder('Your Business Email').fill('john@bakery.com');
    await page.getByPlaceholder('Your Business Phone').fill('1234567890');

    // Step 2: Description field is now unlocked
    const promptTextarea = page.getByPlaceholder('e.g., "We sell organic coffee and pastries. I want a modern and minimalist design."');
    await expect(promptTextarea).toBeVisible();
    await promptTextarea.fill('Fresh organic pastries, bread, coffee and cookies.');

    // Step 3: Services field is now unlocked
    const servicesTextarea = page.getByPlaceholder('e.g., Web design, digital marketing, consulting, coffee and pastries...');
    await expect(servicesTextarea).toBeVisible();
    await servicesTextarea.fill('Bread, Pastries, Coffee, Tea');

    // Step 4: Location & Palette styling is now unlocked
    const locationInput = page.getByPlaceholder('City, State or Country');
    await expect(locationInput).toBeVisible();
    await locationInput.fill('Seattle, WA');

    // Select color palette button (e.g. Modern)
    const paletteBtn = page.getByRole('button', { name: 'Modern' });
    await expect(paletteBtn).toBeVisible();
    await paletteBtn.click();

    // Click Generate Website button
    const generateBtn = page.getByRole('button', { name: 'Generate Website' });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 4. Verify results page loading
    const previewHeading = page.getByRole('heading', { name: 'Modify & Export' });
    await expect(previewHeading).toBeVisible({ timeout: 15000 });

    // Validate preview iframe content contains generated HTML
    const iframe = page.frameLocator('iframe[title="Website Preview"]');
    const h1 = iframe.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText('John Bakery');

    // Check we can toggle to code view
    const codeBtn = page.getByRole('button', { name: 'Code', exact: true });
    await codeBtn.click();

    const codeContainer = page.locator('pre code');
    await expect(codeContainer).toContainText('John Bakery');
  });
});
