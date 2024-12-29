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

    it("handles concurrent document processing", async function() {
        this.timeout(10000);
        
        const doc1 = await openTestDocument(
            `describe("Test1", () => { it("test", () => { cy.visit("/"); }); });`
        );
        const doc2 = await openTestDocument(
            `test.describe("Test2", () => { test("test", async ({page}) => {}); });`
        );
        
        documents.push(doc1, doc2);
        
        const results = await Promise.all([
            executeCommandWithRetry("hamlet.convertToPlaywright"),
            executeCommandWithRetry("hamlet.convertToCypress")
        ]);
        
        assert.ok(doc1.getText().includes("test.describe"));
        assert.ok(doc2.getText().includes("describe"));
    });

    it("preserves document state during rapid conversions", async function() {
        this.timeout(5000);
        
        const doc = await openTestDocument(
            `describe("RapidTest", () => { it("test", () => {}); });`
        );
        documents.push(doc);
        
        await Promise.all(Array(3).fill(0).map(() => 
            executeCommandWithRetry("hamlet.convertToPlaywright")
        ));
        
        const finalText = doc.getText();
        assert.ok(finalText.includes("test.describe"));
        assert.ok(finalText.includes("async"));
    });
});
