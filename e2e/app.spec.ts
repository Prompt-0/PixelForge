import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

test.describe('PixelForge End-to-End Tests', () => {
  let testImagePath: string;

  test.beforeAll(() => {
    // Create a dummy image for testing
    testImagePath = path.join(os.tmpdir(), 'test-image.png');
    // 1x1 transparent PNG base64
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImagePath, Buffer.from(base64Data, 'base64'));
  });

  test.afterAll(() => {
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  test('should load an image, resize it, and trigger export', async ({ page }) => {
    await page.goto('/');

    // Upload the image
    const fileInput = page.locator('.upload-zone__input');
    await fileInput.setInputFiles(testImagePath);

    // Wait for the tool panel to be ready (Resize panel is default)
    await expect(page.locator('.resize-panel')).toBeVisible();

    // Verify ImagePreview loaded (the canvas should be present)
    await expect(page.locator('.image-preview__image').first()).toBeVisible();

    // Change the width (this should trigger resize)
    const widthInput = page.locator('.resize-panel__input').first();
    await widthInput.fill('100');

    // Click Apply Resize
    await page.locator('.resize-panel__apply-btn').click();

    // The Export button should appear once processing is done
    const exportBtn = page.locator('.export-btn');
    await expect(exportBtn).toBeVisible({ timeout: 5000 });

    // Click Export and catch the download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click()
    ]);

    // Verify the downloaded filename ends with .png
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });
});
