"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Login Feature', () => {
    test_1.test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });
    (0, test_1.test)('should login successfully', async ({ page }) => {
        await page.locator('#username').fill('testuser');
        await page.locator('#password').fill('password123');
        await page.getByText('Login').click();
        await (0, test_1.expect)(page).toHaveURL(/dashboard/);
    });
    (0, test_1.test)('should show error for invalid credentials', async ({ page }) => {
        await page.locator('#username').fill('wronguser');
        await page.locator('#password').fill('wrongpass');
        await page.getByText('Login').click();
        await (0, test_1.expect)(page.locator('.error-message')).toBeVisible();
    });
});
//# sourceMappingURL=playwright-sample.js.map