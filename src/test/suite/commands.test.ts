import { describe, it, before, beforeEach, afterEach } from "mocha";
import { strict as assert } from "assert";
import * as vscode from "vscode";
import { openTestDocument, executeCommandWithRetry } from "./test-helpers";

describe("Command Tests", () => {
    let documents: vscode.TextDocument[] = [];

    before(async () => {
        const ext = vscode.extensions.getExtension("YourPublisher.hamlet");
        if (ext) {
            await ext.activate();
        }
    });

    beforeEach(async () => {
        await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    });

    afterEach(async () => {
        for (const doc of documents) {
            try {
                const edit = new vscode.WorkspaceEdit();
                edit.deleteFile(doc.uri, { ignoreIfNotExists: true });
                await vscode.workspace.applyEdit(edit);
            } catch (e) {
                // Silently handle cleanup errors
            }
        }
        documents = [];
    });

    it("convertToPlaywright command works", async function() {
        this.timeout(10000);
        
        const doc = await openTestDocument(`
            describe("Test", () => {
                it("test", () => {
                    cy.visit("/test");
                });
            });
        `);
        documents.push(doc);

        // Show document and wait for it to be ready
        await vscode.window.showTextDocument(doc, { preview: false });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Execute command
        await executeCommandWithRetry("hamlet.convertToPlaywright");

        // Get final text
        const text = doc.getText();
        
        // Assertions with better error messages
        assert.ok(
            text.includes("test.describe"),
            `Expected test.describe in converted code but got:\n${text}`
        );
        assert.ok(
            text.includes("page.goto"),
            `Expected page.goto in converted code but got:\n${text}`
        );
        assert.ok(
            text.includes("async ({ page })"),
            `Expected async page parameter but got:\n${text}`
        );
    });

    it("convertToCypress command works", async function() {
        this.timeout(10000);
        
        const doc = await openTestDocument(`
            import { test, expect } from '@playwright/test';

            test.describe("Test", () => {
                test("test", async ({ page }) => {
                    await page.goto("/test");
                });
            });
        `);
        documents.push(doc);

        // Show document and wait for it to be ready
        await vscode.window.showTextDocument(doc, { preview: false });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Execute command
        await executeCommandWithRetry("hamlet.convertToCypress");

        // Get final text
        const text = doc.getText();

        // Assertions with better error messages
        assert.ok(
            text.includes("describe("),
            `Expected describe in converted code but got:\n${text}`
        );
        assert.ok(
            text.includes("it("),
            `Expected it in converted code but got:\n${text}`
        );
        assert.ok(
            text.includes("cy.visit"),
            `Expected cy.visit in converted code but got:\n${text}`
        );
        assert.ok(
            !text.includes("import { test"),
            `Expected Playwright imports to be removed but found them in:\n${text}`
        );
    });

    it("handles invalid input gracefully", async function() {
        this.timeout(5000);
        
        const doc = await openTestDocument(`
            // This is not a valid test file
            console.log("hello");
        `);
        documents.push(doc);

        try {
            await executeCommandWithRetry("hamlet.convertToCypress");
            await executeCommandWithRetry("hamlet.convertToPlaywright");
        } catch (error) {
            assert.fail("Commands should handle invalid input gracefully");
        }
    });
});
