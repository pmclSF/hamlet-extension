import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { TestParser } from "../../parsers/parser";

describe("Performance Tests", () => {
    it("handles large files efficiently", function() {
        this.timeout(10000);

        // Generate test data
        const source = Array.from({ length: 1000 }, (_, i) => `
            describe('Suite ${i}', () => {
                it('test ${i}', () => {
                    cy.visit('/test-${i}');
                });
            });
        `).join('\n');

        // Parse and measure performance
        const startTime = performance.now();
        const parser = new TestParser(source);
        const blocks = parser.parseBlocks();
        const endTime = performance.now();
        
        // Performance assertion
        const parseTime = endTime - startTime;
        assert.ok(
            parseTime < 5000,
            `Parsing took ${parseTime}ms, which exceeds the 5000ms limit`
        );

        // Content assertions
        assert.ok(
            blocks.length > 0,
            `Expected blocks to be parsed but got empty array`
        );

        // Verify first block structure
        const firstBlock = blocks[0];
        assert.ok(firstBlock, 'First block should exist');
        assert.strictEqual(firstBlock.type, 'suite', 'First block should be a suite');
        assert.ok(firstBlock.title?.includes('Suite'), 'Suite title should contain "Suite"');
        assert.ok(firstBlock.body.includes('cy.visit'), 'Suite body should contain test code');
        assert.ok(firstBlock.startLine > 0, 'Should have valid start line');
        assert.ok(firstBlock.endLine > firstBlock.startLine, 'Should have valid end line');

        // Framework detection
        assert.strictEqual(
            parser.detectFramework(),
            'cypress',
            'Should detect Cypress framework'
        );
    });
});