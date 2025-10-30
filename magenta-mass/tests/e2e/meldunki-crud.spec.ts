import { test, expect } from '@playwright/test';
import { E2ETestUtils } from './test-utils';

test.describe('Meldunki CRUD - minimal UI flow', () => {
  let utils: E2ETestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new E2ETestUtils(page);
    await utils.clearAuth();
  });

  test('create via API, edit and delete via UI', async ({ page }) => {
    // Login
    await utils.login();

    // Go to meldunki
    await utils.navigateTo('/meldunki');

    // Create meldunek via API using browser token
    const created = await page.evaluate(async () => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No token');

      const body = {
        incident_name: 'Test Meldunek',
        description: 'Opis testowy',
        incident_date: '2024-05-01'
      };
      const resp = await fetch('/api/meldunki', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error('POST /api/meldunki failed');
      return await resp.json();
    });

    expect(created?.success).toBeTruthy();

    // Reload to see the new item
    await utils.navigateTo('/meldunki');

    // Edit first item (prompts)
    // Handle two prompts: title and description
    const newTitle = 'Zaktualizowany Meldunek';
    const newDesc = 'Zmieniony opis testowy';
    let promptCount = 0;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        promptCount += 1;
        await dialog.accept(promptCount === 1 ? newTitle : newDesc);
      } else if (dialog.type() === 'alert' || dialog.type() === 'confirm') {
        await dialog.accept();
      }
    });

    // Click first edit button
    const firstEdit = page.locator('button:has-text("Edytuj")').first();
    await firstEdit.click();

    // Wait for list to refresh and verify updated title visible somewhere
    await expect(page.getByText(newTitle)).toBeVisible();

    // Delete the item (confirm dialog)
    const firstDelete = page.locator('button:has-text("Usuń")').first();
    await firstDelete.click();

    // Verify it is gone
    await expect(page.getByText(newTitle)).toHaveCount(0);
  });
});


