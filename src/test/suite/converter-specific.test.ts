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
                test("navigation", async ({ page }) => {
                    await page.goto("/test");
                    await page.click(".button");
                });
            `;
            const converter = new PlaywrightToTestRailConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes("step('Navigate to"));
            assert.ok(result.convertedCode.includes("step('Click"));
        });

        it("handles expect assertions", () => {
            const source = `test("test", async ({ page }) => { expect(page.locator(".element")).toBeVisible(); });`;
            const converter = new PlaywrightToTestRailConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes("step('Verify"));
        });
    });
});
