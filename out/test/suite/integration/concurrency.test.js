"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
(0, mocha_1.describe)('Concurrency Tests', () => {
    (0, mocha_1.it)('should handle multiple documents simultaneously', async () => {
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
    (0, mocha_1.it)('should handle rapid successive conversions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            content: `describe('Test', () => { cy.visit('/'); });`,
            language: 'javascript'
        });
        await vscode.window.showTextDocument(doc);
        const promises = Array(3).fill(0).map(() => vscode.commands.executeCommand('hamlet.convertToPlaywright'));
        await Promise.all(promises);
        const finalText = doc.getText();
        assert.ok(finalText.includes('test.describe'));
    });
});
//# sourceMappingURL=concurrency.test.js.map