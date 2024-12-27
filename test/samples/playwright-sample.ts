import { test, expect } from '@playwright/test';

test.describe('Login Feature', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should login successfully', async ({ page }) => {
        await page.locator('#username').fill('testuser');
        await page.locator('#password').fill('password123');
        await page.getByText('Login').click();
        await expect(page).toHaveURL(/dashboard/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.locator('#username').fill('wronguser');
        await page.locator('#password').fill('wrongpass');
        await page.getByText('Login').click();
        await expect(page.locator('.error-message')).toBeVisible();
    });
});
