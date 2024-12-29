import { describe, it, before } from "mocha";
import { strict as assert } from "assert";
import * as vscode from "vscode";
import { openTestDocument, executeCommandWithRetry } from "./test-helpers";

describe("Command Tests", () => {
    before(async () => {
        const ext = vscode.extensions.getExtension("YourPublisher.hamlet");
        if (ext) {
            await ext.activate();
        }
    });

    it("convertToPlaywright command works", async function() {
        this.timeout(5000);
        const doc = await openTestDocument(`
            describe("Test", () => {
                it("test", () => {
                    cy.visit("/test");
                });
            });
        `);
        
        await executeCommandWithRetry("hamlet.convertToPlaywright");
        const text = doc.getText();
        assert.ok(text.includes("test.describe"));
        assert.ok(text.includes("page.goto"));
    });

    it("convertToCypress command works", async function() {
        this.timeout(5000);
        const doc = await openTestDocument(`
            test.describe("Test", () => {
                test("test", async ({ page }) => {
                    await page.goto("/test");
                });
            });
        `);
        
        await executeCommandWithRetry("hamlet.convertToCypress");
        const text = doc.getText();
        assert.ok(text.includes("describe("));
        assert.ok(text.includes("cy.visit"));
    });
});
