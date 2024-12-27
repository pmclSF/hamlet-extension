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
const sinon = __importStar(require("sinon"));
(0, mocha_1.describe)('Settings Tests', () => {
    let configStub;
    (0, mocha_1.beforeEach)(() => {
        configStub = sinon.stub(vscode.workspace, 'getConfiguration').returns({
            get: sinon.stub(),
            update: sinon.stub(),
            has: sinon.stub()
        });
    });
    (0, mocha_1.afterEach)(() => {
        sinon.restore();
    });
    (0, mocha_1.describe)('Default Settings', () => {
        (0, mocha_1.it)('should have correct default values', async () => {
            const config = vscode.workspace.getConfiguration('hamlet');
            assert.strictEqual(config.get('frameworks.defaultSource'), 'cypress');
            assert.strictEqual(config.get('highlighting.enabled'), true);
            assert.strictEqual(config.get('codeStyle.indentation'), 'spaces');
        });
    });
    (0, mocha_1.describe)('Settings Updates', () => {
        (0, mocha_1.it)('should update framework source setting', async () => {
            const config = vscode.workspace.getConfiguration('hamlet');
            await config.update('frameworks.defaultSource', 'playwright');
            assert.strictEqual(config.get('frameworks.defaultSource'), 'playwright');
        });
        (0, mocha_1.it)('should handle invalid setting values', async () => {
            const config = vscode.workspace.getConfiguration('hamlet');
            await config.update('codeStyle.indentation', 'invalid');
            // Should fall back to default
            assert.strictEqual(config.get('codeStyle.indentation'), 'spaces');
        });
    });
    (0, mocha_1.describe)('Settings Persistence', () => {
        (0, mocha_1.it)('should persist settings across sessions', async () => {
            const config = vscode.workspace.getConfiguration('hamlet');
            await config.update('highlighting.enabled', false);
            // Simulate reload
            const newConfig = vscode.workspace.getConfiguration('hamlet');
            assert.strictEqual(newConfig.get('highlighting.enabled'), false);
        });
    });
});
//# sourceMappingURL=settings.test.js.map