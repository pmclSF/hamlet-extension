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
        
        const input = `
    import { test, expect } from '@playwright/test';
    
    test.describe("Test Suite", () => {
        test("should visit page", async ({ page }) => {
            await page.goto("/test");
            await page.click(".button");
        });
    });`.trim();
    
        const doc = await openTestDocument(input);
        documents.push(doc);
    
        console.log('Before conversion:', doc.getText());
        
        await vscode.window.showTextDocument(doc, { preview: false });
        await new Promise(resolve => setTimeout(resolve, 1000));
    
        await executeCommandWithRetry("hamlet.convertToCypress");
        
        const text = doc.getText();
        console.log('After conversion:', text);
    
        const expectedPatterns = [
            '/// <reference types="cypress" />',
            "describe('Test Suite'",
            "it('should visit page'",
            "cy.visit('/test')",
            "cy.get('.button').click()"
        ];
    
        expectedPatterns.forEach(pattern => {
            const includes = text.includes(pattern);
            if (!includes) {
                console.error(`Missing pattern: ${pattern}`);
                console.error(`Full converted text:\n${text}`);
            }
            assert.ok(
                includes,
                `Expected to find "${pattern}" in converted code:\n${text}`
            );
        });
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
