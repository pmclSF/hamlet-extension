import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { CypressToPlaywrightConverter } from "../../converters/cypress/to-playwright";
import { PlaywrightToTestRailConverter } from "../../converters/playwright/to-testrail";
import { TestRailToCypressConverter } from "../../converters/testrail/to-cypress";

describe("Framework-Specific Converter Tests", () => {
    describe("Cypress to Playwright", () => {
        it("converts cy.visit correctly", () => {
            const source = 'describe("test", () => { it("test", () => { cy.visit("/page"); }); });';
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes('page.goto("/page")'));
        });

        it("converts cy.get and click correctly", () => {
            const source = 'describe("test", () => { it("test", () => { cy.get(".btn").click(); }); });';
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes('page.locator(".btn").click()'));
        });

        it("converts cy.contains correctly", () => {
            const source = 'describe("test", () => { it("test", () => { cy.contains("text"); }); });';
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes('page.getByText("text")'));
        });

        it("handles complex assertions", () => {
            const source = 'describe("test", () => { it("test", () => { cy.get("element").should("be.visible").and("have.text", "test"); }); });';
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes("expect"));
            assert.ok(result.convertedCode.includes("toBeVisible"));
        });
    });

    describe("Playwright to TestRail", () => {
        it("converts page actions to steps", () => {
            const source = `
                test('navigation', async ({ page }) => {
                    await page.goto('/test');
                    await page.click('.button');
                });
            `;
            const converter = new PlaywrightToTestRailConverter(source);
            const result = converter.convertToTargetFramework();

            // Debug output
            console.log('Source:', source);
            console.log('Converted:', result.convertedCode);

            // Check basic structure
            assert.ok(result.success, "Conversion should succeed");
            assert.ok(
                result.convertedCode.includes("testCase('navigation'"),
                "Should include test case"
            );

            // Check navigation step
            assert.match(
                result.convertedCode,
                /step\(['"]Navigate to \/test['"].*?\)/s,
                "Should include navigation step"
            );

            // Check click step
            assert.match(
                result.convertedCode,
                /step\(['"]Click.*?button['"].*?\)/s,
                "Should include click step"
            );
        });

        it("handles expect assertions", () => {
            const source = `
                test('visibility test', async ({ page }) => {
                    const element = page.locator('.element');
                    await expect(element).toBeVisible();
                });
            `;
            const converter = new PlaywrightToTestRailConverter(source);
            const result = converter.convertToTargetFramework();

            // Debug output
            console.log('Source:', source);
            console.log('Converted:', result.convertedCode);

            // Check basic structure
            assert.ok(result.success, "Conversion should succeed");
            assert.ok(
                result.convertedCode.includes("testCase('visibility test'"),
                "Should include test case"
            );

            // Check verification step
            assert.match(
                result.convertedCode,
                /step\(['"]Verify.*?visible['"].*?\)/s,
                "Should include verification step"
            );
        });

        it("handles complex test cases", () => {
            const source = `
                test('complex test', async ({ page }) => {
                    await page.goto('/login');
                    await page.fill('#username', 'user');
                    await expect(page.locator('.error')).toHaveText('Invalid');
                });
            `;
            const converter = new PlaywrightToTestRailConverter(source);
            const result = converter.convertToTargetFramework();

            // Debug output
            console.log('Source:', source);
            console.log('Converted:', result.convertedCode);

            assert.ok(result.success);
            assert.match(
                result.convertedCode,
                /step\(['"]Navigate to \/login['"].*?\)/s,
                "Should include navigation"
            );
            assert.match(
                result.convertedCode,
                /step\(['"]Enter.*?user.*?username['"].*?\)/s,
                "Should include input"
            );
            assert.match(
                result.convertedCode,
                /step\(['"]Verify.*?Invalid['"].*?\)/s,
                "Should include verification"
            );
        });
    });
});