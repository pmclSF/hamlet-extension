import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { TestParser } from "../../parsers/parser";

describe("Performance Tests", () => {
    it("handles large files efficiently", function() {
        this.timeout(10000);
        let source = "";
        for (let i = 0; i < 1000; i++) {
            source += `describe("Suite ${i}", () => {
                it("test ${i}", () => {
                    cy.visit("/test-${i}");
                });
            });\n`;
        }
        
        const startTime = performance.now();
        const parser = new TestParser(source);
        const blocks = parser.parseBlocks();
        const endTime = performance.now();
        
        assert.ok(endTime - startTime < 5000, "Parsing should complete within 5 seconds");
        assert.ok(blocks.length > 0);
    });
});
