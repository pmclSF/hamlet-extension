import { describe, it } from 'mocha';
import * as assert from 'assert';
import { ASTHelper } from '../../../src/utils/astHelper';

describe('ASTHelper', () => {
 describe('Node Creation', () => {
   it('should create test node', () => {
     const node = ASTHelper.createTestNode('MyTest', 'test body');
     assert.deepStrictEqual(node, {
       type: 'test',
       name: 'MyTest',
       body: 'test body',
       children: []
     });
   });

   it('should create suite node', () => {
     const node = ASTHelper.createSuiteNode('MySuite');
     assert.deepStrictEqual(node, {
       type: 'suite',
       name: 'MySuite', 
       children: []
     });
   });

   it('should create hook node', () => {
     const node = ASTHelper.createHookNode('beforeEach', 'hook body');
     assert.deepStrictEqual(node, {
       type: 'hook',
       name: 'beforeEach',
       body: 'hook body',
       children: []
     });
   });
 });

 describe('AST Traversal', () => {
   it('should traverse nodes and apply callback', () => {
     const root = ASTHelper.createSuiteNode('Root');
     const child = ASTHelper.createTestNode('Child', '');
     root.children = [child];
     
     const visited: string[] = [];
     ASTHelper.traverse(root, node => visited.push(node.name!));
     
     assert.deepStrictEqual(visited, ['Root', 'Child']);
   });
 });

 describe('Assertion Conversion', () => {
   it('should convert Cypress to Playwright assertions', () => {
     const node = {
       type: 'assertion',
       value: 'be.visible'
     };
     const result = ASTHelper.cypressToPlaywrightAssertion(node);
     assert.strictEqual(result, 'toBeVisible');
   });

   it('should convert Playwright to Cypress assertions', () => {
     const node = {
       type: 'assertion', 
       value: 'toBeVisible'
     };
     const result = ASTHelper.playwrightToCypressAssertion(node);
     assert.strictEqual(result, 'be.visible');
   });
 });

 describe('Code Generation', () => {
   it('should generate Cypress code', () => {
     const suite = ASTHelper.createSuiteNode('TestSuite');
     const code = ASTHelper.generateCode(suite, 'cypress');
     assert.ok(code.includes("describe('TestSuite'"));
   });

   it('should generate Playwright code', () => {
     const suite = ASTHelper.createSuiteNode('TestSuite');
     const code = ASTHelper.generateCode(suite, 'playwright');
     assert.ok(code.includes("test.describe('TestSuite'"));
   });

   it('should generate TestRail code', () => {
     const suite = ASTHelper.createSuiteNode('TestSuite');
     const code = ASTHelper.generateCode(suite, 'testrail');
     assert.ok(code.includes("suite('TestSuite'"));
   });
 });
});
