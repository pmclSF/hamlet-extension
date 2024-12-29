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
                await vscode.workspace.fs.delete(doc.uri);
            } catch (e) {
                console.warn(`Cleanup failed for ${doc.uri}`);
            }
        }
        documents = [];
    });

    it("handles concurrent conversions", async function() {
        this.timeout(10000);
        
        const doc = await openTestDocument(`
            describe("Test", () => {
                it("test", () => {
                    cy.visit("/test");
                });
            });
        `);
        documents.push(doc);
        
        const conversions = Array(3).fill(0).map(() => 
            executeCommandWithRetry("hamlet.convertToPlaywright")
        );

        await Promise.all(conversions);
        
        const finalText = doc.getText();
        assert.ok(finalText.includes("test.describe"));
        assert.ok(finalText.includes("page.goto"));
    });
});
