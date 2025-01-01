import { describe, it, beforeEach, afterEach } from "mocha";
import { strict as assert } from "assert";
import * as vscode from "vscode";
import { openTestDocument, executeCommandWithRetry } from "./test-helpers";

describe("Integration Tests", () => {
    let documents: vscode.TextDocument[] = [];

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
                console.warn(`Cleanup failed for ${doc.uri}:`, e);
            }
        }
        documents = [];
    });

    it("handles concurrent conversions", async function() {
        this.timeout(30000);

        try {
            // Create a test document
            const doc = await openTestDocument(`
                describe('Test Suite', () => {
                    it('test case', () => {
                        cy.visit('/test');
                        cy.get('.button').click();
                    });
                });
            `);
            
            documents.push(doc);

            // Ensure document is focused
            await vscode.window.showTextDocument(doc, {
                preview: false,
                preserveFocus: false
            });

            // Wait for document to be fully loaded
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Execute conversion
            await vscode.commands.executeCommand('hamlet.convertToPlaywright');

            // Wait for conversion to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get the final text
            const text = doc.getText();

            // Verify conversion
            assert.ok(
                text.includes('test.describe'),
                `Expected 'test.describe' in:\n${text}`
            );
            assert.ok(
                text.includes('await page.goto'),
                `Expected 'await page.goto' in:\n${text}`
            );
            assert.ok(
                !text.includes('cy.visit'),
                `Should not contain 'cy.visit' in:\n${text}`
            );

        } catch (error) {
            console.error('Integration test failed:', error);
            throw error;
        }
    });
});