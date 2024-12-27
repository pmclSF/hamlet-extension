import { describe, it } from 'mocha';
import * as assert from 'assert';
import { TestParser } from '../../../src/parsers/parser';

describe('Security Tests', () => {
 it('should sanitize malicious test names', () => {
   const source = `
     describe('"); process.exit(1); //', () => {
       it('", () => { throw new Error("hack"); }); //', () => {});
     });
   `;
   const parser = new TestParser(source);
   const blocks = parser.parseBlocks();
   assert.ok(blocks.every(b => !b.title?.includes('process.exit')));
 });

 it('should prevent path traversal', () => {
   const maliciousPath = '../../../etc/passwd';
   const source = `describe('Test', () => { cy.visit('${maliciousPath}'); });`;
   const parser = new TestParser(source);
   const blocks = parser.parseBlocks();
   assert.ok(!blocks.some(b => b.body?.includes('../..')));
 });
});
