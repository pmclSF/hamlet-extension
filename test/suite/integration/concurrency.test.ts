import { describe, it } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';

describe('Concurrency Tests', () => {
 it('should handle multiple documents simultaneously', async () => {
   const doc1 = await vscode.workspace.openTextDocument({
     content: `describe('Cypress', () => { cy.visit('/'); });`,
     language: 'javascript'
   });
   const doc2 = await vscode.workspace.openTextDocument({
     content: `test('Playwright', async ({page}) => { await page.goto('/'); });`,
     language: 'javascript'
   });

   await Promise.all([
     vscode.window.showTextDocument(doc1, vscode.ViewColumn.One),
     vscode.window.showTextDocument(doc2, vscode.ViewColumn.Two)
   ]);

   const results = await Promise.all([
     vscode.commands.executeCommand('hamlet.detectFramework', doc1),
     vscode.commands.executeCommand('hamlet.detectFramework', doc2)
   ]);

   assert.strictEqual(results[0], 'cypress');
   assert.strictEqual(results[1], 'playwright');
 });

 it('should handle rapid successive conversions', async () => {
   const doc = await vscode.workspace.openTextDocument({
     content: `describe('Test', () => { cy.visit('/'); });`,
     language: 'javascript'
   });
   await vscode.window.showTextDocument(doc);

   const promises = Array(3).fill(0).map(() => 
     vscode.commands.executeCommand('hamlet.convertToPlaywright')
   );

   await Promise.all(promises);
   const finalText = doc.getText();
   assert.ok(finalText.includes('test.describe'));
 });
});
