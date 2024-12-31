import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { TestParser } from "../../parsers/parser";

describe("Performance Tests", () => {
    it("handles large files efficiently", function() {
        // Set longer timeout for large file processing
        this.timeout(10000);

        // Generate test data with proper indentation
        console.log('\nGenerating test data...');
        const source = Array.from({ length: 1000 }, (_, i) => 
            `describe('Suite ${i}', () => {
                it('test ${i}', () => {
                    cy.visit('/test-${i}');
                });
            });`
        ).join('\n');

        // Debug: Show sample of generated source
        console.log('\nGenerated Source Sample:');
        console.log(source.split('\n').slice(0, 10).join('\n'));
        console.log('...');
        console.log(`Total source length: ${source.length} characters`);

        // Initialize parser and start timing
        const parser = new TestParser(source);

        // Parse and measure performance
        console.log('\nStarting parse...');
        const startTime = performance.now();
        const blocks = parser.parseBlocks();
        const endTime = performance.now();
        const parseTime = endTime - startTime;

        // Debug: Show parsing results
        console.log('\nParsing Results:');
        console.log(`Parse time: ${parseTime.toFixed(2)}ms`);
        console.log(`Blocks found: ${blocks.length}`);
        
        if (blocks.length > 0) {
            console.log('\nFirst Block Details:');
            console.log(JSON.stringify(blocks[0], null, 2));
        }

        // Performance assertion
        assert.ok(
            parseTime < 5000,
            `Parsing took ${parseTime.toFixed(2)}ms, which exceeds the 5000ms limit`
        );

        // Content assertions
        assert.ok(
            blocks.length > 0,
            `No blocks were parsed from source.\nSource sample:\n${source.slice(0, 200)}`
        );

        // First block structure checks
        const firstBlock = blocks[0];
        assert.ok(firstBlock, 'First block should exist');
        
        assert.strictEqual(
            firstBlock.type,
            'suite',
            `First block should be of type 'suite' but got '${firstBlock.type}'`
        );

        assert.ok(
            firstBlock.title?.includes('Suite'),
            `Expected title to contain 'Suite' but got '${firstBlock.title}'`
        );

        assert.ok(
            firstBlock.body.includes('cy.visit'),
            `Expected body to contain 'cy.visit' but got:\n${firstBlock.body}`
        );

        assert.ok(
            firstBlock.startLine > 0,
            `Invalid start line: ${firstBlock.startLine}`
        );

        assert.ok(
            firstBlock.endLine > firstBlock.startLine,
            `Invalid line numbers: start=${firstBlock.startLine}, end=${firstBlock.endLine}`
        );

        // Framework detection
        assert.strictEqual(
            parser.detectFramework(),
            'cypress',
            'Framework should be detected as Cypress'
        );

        console.log('\nAll assertions passed successfully!');
    });
});