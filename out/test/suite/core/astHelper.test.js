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
const astHelper_1 = require("../../../src/utils/astHelper");
(0, mocha_1.describe)('ASTHelper', () => {
    (0, mocha_1.describe)('Node Creation', () => {
        (0, mocha_1.it)('should create test node', () => {
            const node = astHelper_1.ASTHelper.createTestNode('MyTest', 'test body');
            assert.deepStrictEqual(node, {
                type: 'test',
                name: 'MyTest',
                body: 'test body',
                children: []
            });
        });
        (0, mocha_1.it)('should create suite node', () => {
            const node = astHelper_1.ASTHelper.createSuiteNode('MySuite');
            assert.deepStrictEqual(node, {
                type: 'suite',
                name: 'MySuite',
                children: []
            });
        });
        (0, mocha_1.it)('should create hook node', () => {
            const node = astHelper_1.ASTHelper.createHookNode('beforeEach', 'hook body');
            assert.deepStrictEqual(node, {
                type: 'hook',
                name: 'beforeEach',
                body: 'hook body',
                children: []
            });
        });
    });
    (0, mocha_1.describe)('AST Traversal', () => {
        (0, mocha_1.it)('should traverse nodes and apply callback', () => {
            const root = astHelper_1.ASTHelper.createSuiteNode('Root');
            const child = astHelper_1.ASTHelper.createTestNode('Child', '');
            root.children = [child];
            const visited = [];
            astHelper_1.ASTHelper.traverse(root, node => visited.push(node.name));
            assert.deepStrictEqual(visited, ['Root', 'Child']);
        });
    });
    (0, mocha_1.describe)('Assertion Conversion', () => {
        (0, mocha_1.it)('should convert Cypress to Playwright assertions', () => {
            const node = {
                type: 'assertion',
                value: 'be.visible'
            };
            const result = astHelper_1.ASTHelper.cypressToPlaywrightAssertion(node);
            assert.strictEqual(result, 'toBeVisible');
        });
        (0, mocha_1.it)('should convert Playwright to Cypress assertions', () => {
            const node = {
                type: 'assertion',
                value: 'toBeVisible'
            };
            const result = astHelper_1.ASTHelper.playwrightToCypressAssertion(node);
            assert.strictEqual(result, 'be.visible');
        });
    });
    (0, mocha_1.describe)('Code Generation', () => {
        (0, mocha_1.it)('should generate Cypress code', () => {
            const suite = astHelper_1.ASTHelper.createSuiteNode('TestSuite');
            const code = astHelper_1.ASTHelper.generateCode(suite, 'cypress');
            assert.ok(code.includes("describe('TestSuite'"));
        });
        (0, mocha_1.it)('should generate Playwright code', () => {
            const suite = astHelper_1.ASTHelper.createSuiteNode('TestSuite');
            const code = astHelper_1.ASTHelper.generateCode(suite, 'playwright');
            assert.ok(code.includes("test.describe('TestSuite'"));
        });
        (0, mocha_1.it)('should generate TestRail code', () => {
            const suite = astHelper_1.ASTHelper.createSuiteNode('TestSuite');
            const code = astHelper_1.ASTHelper.generateCode(suite, 'testrail');
            assert.ok(code.includes("suite('TestSuite'"));
        });
    });
});
//# sourceMappingURL=astHelper.test.js.map