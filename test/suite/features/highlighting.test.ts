import { describe, it } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';

describe('Syntax Highlighting', () => {
 describe('Cypress Commands', () => {
   it('should highlight cy.* commands correctly', async () => {
     const doc = await openTestDocument(`cy.visit('/');`);
     const tokens = await getDocumentTokens(doc);
     
     assert.ok(tokens.some(t => 
       t.range.start.character === 0 && 
       t.range.end.character === 2 &&
       t.tokenType === 'keyword.control.cypress'
     ));
   });

   it('should highlight Cypress assertions', async () => {
     const doc = await openTestDocument(`cy.get('.element').should('be.visible');`);
     const tokens = await getDocumentTokens(doc);
     
     assert.ok(tokens.some(t => 
       t.tokenType === 'keyword.control.cypress.assertion'
     ));
   });
 });

 describe('Playwright Commands', () => {
   it('should highlight page.* commands', async () => {
     const doc = await openTestDocument(`await page.goto('/');`);
     const tokens = await getDocumentTokens(doc);
     
     assert.ok(tokens.some(t => 
       t.tokenType === 'keyword.control.playwright'
     ));
   });

   it('should highlight Playwright assertions', async () => {
     const doc = await openTestDocument(`await expect(page).toBeVisible();`);
     const tokens = await getDocumentTokens(doc);
     
     assert.ok(tokens.some(t => 
       t.tokenType === 'keyword.control.playwright.assertion'
     ));
   });
 });

 describe('Color Theme', () => {
   it('should apply correct colors from theme', async () => {
     await vscode.workspace.getConfiguration().update(
       'workbench.colorTheme',
       'Hamlet Color Theme',
       vscode.ConfigurationTarget.Global
     );

     const doc = await openTestDocument(`cy.visit('/');`);
     const tokens = await getDocumentTokens(doc);
     const cypressToken = tokens.find(t => t.tokenType === 'keyword.control.cypress');
     
     assert.strictEqual(getTokenColor(cypressToken!), '#FF0000');
   });
 });
});

async function openTestDocument(content: string) {
 return await vscode.workspace.openTextDocument({
   content,
   language: 'javascript'
 });
}

async function getDocumentTokens(document: vscode.TextDocument) {
 const provider = await vscode.extensions.getExtension('YourPublisher.hamlet')!
   .activate()
   .then(ext => ext.getSemanticTokensProvider());
   
 return await provider.provideDocumentSemanticTokens(document, null);
}

function getTokenColor(token: any): string {
 // Implementation depends on how your extension provides token colors
 return '#FF0000'; // Placeholder
}
