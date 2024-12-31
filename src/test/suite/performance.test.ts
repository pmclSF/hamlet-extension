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
        console.log('\nStarting parse...');
        const startTime = performance.now();
        const parser = new TestParser(source);
        const blocks = parser.parseBlocks();
        const endTime = performance.now();
        const parseTime = endTime - startTime;
    
        // Assertions
        assert.ok(
            parseTime < 5000,
            `Parsing took ${parseTime.toFixed(2)}ms, which exceeds the 5000ms limit`
        );
    
        assert.ok(
            blocks.length > 0,
            `No blocks were parsed from source`
        );
    
        // Verify first block structure
        const firstBlock = blocks[0];
        assert.ok(firstBlock, 'First block should exist');
        assert.strictEqual(firstBlock.type, 'suite', 'First block should be a suite');
        
        // More detailed content checks
        assert.ok(
            firstBlock.body.includes('cy.visit'),
            `Block body should contain cy.visit but got:\n${firstBlock.body}`
        );
        
        // Check that we got the expected number of blocks
        assert.strictEqual(
            blocks.length,
            2000, // 1000 describe blocks + 1000 it blocks
            `Expected 2000 blocks but got ${blocks.length}`
        );
    
        // Check some random blocks for correct content
        const randomIndex = Math.floor(Math.random() * blocks.length);
        const randomBlock = blocks[randomIndex];
        assert.ok(
            randomBlock.body.includes('describe') || randomBlock.body.includes('it'),
            `Random block ${randomIndex} has invalid content: ${randomBlock.body}`
        );
    });
});