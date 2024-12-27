import { describe, it, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';

describe('Settings Tests', () => {
 let configStub: sinon.SinonStub;

 beforeEach(() => {
   configStub = sinon.stub(vscode.workspace, 'getConfiguration').returns({
     get: sinon.stub(),
     update: sinon.stub(),
     has: sinon.stub()
   } as any);
 });

 afterEach(() => {
   sinon.restore();
 });

 describe('Default Settings', () => {
   it('should have correct default values', async () => {
     const config = vscode.workspace.getConfiguration('hamlet');
     
     assert.strictEqual(config.get('frameworks.defaultSource'), 'cypress');
     assert.strictEqual(config.get('highlighting.enabled'), true);
     assert.strictEqual(config.get('codeStyle.indentation'), 'spaces');
   });
 });

 describe('Settings Updates', () => {
   it('should update framework source setting', async () => {
     const config = vscode.workspace.getConfiguration('hamlet');
     await config.update('frameworks.defaultSource', 'playwright');
     
     assert.strictEqual(
       config.get('frameworks.defaultSource'),
       'playwright'
     );
   });

   it('should handle invalid setting values', async () => {
     const config = vscode.workspace.getConfiguration('hamlet');
     await config.update('codeStyle.indentation', 'invalid');
     
     // Should fall back to default
     assert.strictEqual(
       config.get('codeStyle.indentation'),
       'spaces'
     );
   });
 });

 describe('Settings Persistence', () => {
   it('should persist settings across sessions', async () => {
     const config = vscode.workspace.getConfiguration('hamlet');
     await config.update('highlighting.enabled', false);
     
     // Simulate reload
     const newConfig = vscode.workspace.getConfiguration('hamlet');
     assert.strictEqual(newConfig.get('highlighting.enabled'), false);
   });
 });
});
