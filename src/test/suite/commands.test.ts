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

        await vscode.window.showTextDocument(doc, { preview: false });
        await new Promise(resolve => setTimeout(resolve, 1000));

        await executeCommandWithRetry("hamlet.convertToPlaywright");

        const text = doc.getText();
        assert.ok(
            text.includes("test.describe"),
            `Expected test.describe in converted code but got:\n${text}`
        );
        assert.ok(
            text.includes("page.goto"),
            `Expected page.goto in converted code but got:\n${text}`
        );
    });

    it("convertToCypress command works", async function() {
        this.timeout(10000);
        
        const doc = await openTestDocument(`
            import { test, expect } from '@playwright/test';

            test.describe("Test Suite", () => {
                test("should visit page", async ({ page }) => {
                    await page.goto("/test");
                    await page.click(".button");
                });
            });
        `);
        documents.push(doc);

        // Log initial content
        console.log('Initial content:', doc.getText());

        await vscode.window.showTextDocument(doc, { preview: false });
        await new Promise(resolve => setTimeout(resolve, 1000));

        await executeCommandWithRetry("hamlet.convertToCypress");
        
        // Get converted text and log it
        const text = doc.getText();
        console.log('Converted content:', text);

        // More specific assertions
        assert.match(
            text,
            /describe\(['"]Test Suite['"]/,
            `Expected describe block but got:\n${text}`
        );
        assert.match(
            text,
            /it\(['"]should visit page['"]/,
            `Expected it block but got:\n${text}`
        );
        assert.match(
            text,
            /cy\.visit\(['"]\/test['"]\)/,
            `Expected cy.visit but got:\n${text}`
        );
        assert.match(
            text,
            /cy\.get\(['"]\.button['"]\)\.click\(\)/,
            `Expected cy.get().click() but got:\n${text}`
        );

        // Verify Playwright code is removed
        assert.ok(
            !text.includes("import { test"),
            `Playwright imports should be removed but found in:\n${text}`
        );
        assert.ok(
            !text.includes("async ({ page })"),
            `Playwright page object should be removed but found in:\n${text}`
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
