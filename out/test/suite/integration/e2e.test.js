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
(0, mocha_1.describe)('End-to-End Tests', () => {
    (0, mocha_1.it)('should convert Cypress -> Playwright -> TestRail with settings changes', async () => {
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
        await vscode.workspace.getConfiguration().update('hamlet.highlighting.enabled', true, vscode.ConfigurationTarget.Global);
        // Convert to TestRail
        await vscode.commands.executeCommand('hamlet.convertToTestRail');
        text = doc.getText();
        assert.ok(text.includes('suite('));
    });
});
//# sourceMappingURL=e2e.test.js.map