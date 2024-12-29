import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { TestParser } from "../../parsers/parser";
import { openTestDocument, assertBlockStructure } from "./test-helpers";

describe("Parser Tests", () => {
    describe("Framework Detection", () => {
        it("detects Cypress framework", () => {
            const source = `describe("CypressTest", () => { it("test", () => { cy.visit("/"); }); });`;
            const parser = new TestParser(source);
            assert.strictEqual(parser.detectFramework(), "cypress");
        });

        it("detects Playwright framework", () => {
            const source = `import { test } from "@playwright/test";
                test("PlaywrightTest", async ({ page }) => { await page.goto("/"); });`;
            const parser = new TestParser(source);
            assert.strictEqual(parser.detectFramework(), "playwright");
        });

        it("handles mixed framework signals", () => {
            const source = `describe("Mixed", () => {
                it("test", () => { cy.visit("/"); });
                test("pw", async ({ page }) => {});
            });`;
            const parser = new TestParser(source);
            const framework = parser.detectFramework();
            assert.ok(framework === "cypress" || framework === "playwright");
        });
    });

    describe("Block Parsing", () => {
        it("parses nested blocks correctly", () => {
            const source = `describe("Outer", () => {
                describe("Inner", () => {
                    it("test", () => {});
                });
            });`;
            const parser = new TestParser(source);
            const blocks = parser.parseBlocks();
            assertBlockStructure(blocks, 3);
        });

        it("handles empty blocks", () => {
            const parser = new TestParser("");
            const blocks = parser.parseBlocks();
            assert.strictEqual(blocks.length, 0);
        });
    });
});
