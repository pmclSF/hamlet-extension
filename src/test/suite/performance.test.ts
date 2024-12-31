import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { TestParser } from "../../parsers/parser";

describe("Performance Tests", () => {
    it("handles large files efficiently", function() {
        this.timeout(10000);
    
        // Generate test data
        const source = Array.from({ length: 1000 }, (_, i) => 
            `describe('Suite ${i}', () => {
                it('test ${i}', () => {
                    cy.visit('/test-${i}');
                });
            });`
        ).join('\n');
    
        // Parse and measure performance
        const parser = new TestParser(source, false); // Set to true for debugging
        const startTime = performance.now();
        const blocks = parser.parseBlocks();
        const endTime = performance.now();
        const parseTime = endTime - startTime;
    
        // Assertions with clean error messages
        assert.ok(
            parseTime < 5000,
            `Parse time exceeded limit: ${parseTime.toFixed(2)}ms`
        );
    
        assert.ok(blocks.length > 0, 'No blocks parsed');
        
        const firstBlock = blocks[0];
        assert.strictEqual(firstBlock.type, 'suite', 'Invalid block type');
        assert.ok(firstBlock.title?.includes('Suite'), 'Invalid block title');
        assert.ok(firstBlock.body.includes('cy.visit'), 'Missing expected content');
        assert.ok(firstBlock.startLine > 0, 'Invalid start line');
        assert.ok(firstBlock.endLine > firstBlock.startLine, 'Invalid end line');
    });
});