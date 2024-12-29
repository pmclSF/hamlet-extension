import { describe, it } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';

describe('End-to-End Tests', () => {
 it('should convert Cypress -> Playwright -> TestRail with settings changes', async () => {
   const doc = await vscode.workspace.openTextDocument({
     content: `
       describe('E2E Test', () => {
         it('should work', () => {
           cy.visit('/test');
           cy.get('.element').should('be.visible');
         });
       });
     `,
     language: 'javascript'
   });
   await vscode.window.showTextDocument(doc);

   // Convert to Playwright
   await vscode.commands.executeCommand('hamlet.convertToPlaywright');
   let text = doc.getText();
   assert.ok(text.includes('test.describe'));

   // Toggle setting
   await vscode.workspace.getConfiguration().update(
     'hamlet.highlighting.enabled',
     true,
     vscode.ConfigurationTarget.Global
   );

   // Convert to TestRail
   await vscode.commands.executeCommand('hamlet.convertToTestRail');
   text = doc.getText();
   assert.ok(text.includes('suite('));
 });
});
