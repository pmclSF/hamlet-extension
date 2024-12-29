import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { TestParser } from "../../parsers/parser";
import { CypressToPlaywrightConverter } from "../../converters/cypress/to-playwright";

describe("Performance Tests", () => {
    it("parses large files efficiently", function() {
        this.timeout(10000);
        let source = "";
        for (let i = 0; i < 1000; i++) {
            source += `describe("Suite ${i}", () => {
                it("test ${i}", () => {
                    cy.visit("/test-${i}");
                    cy.get(".element-${i}").click();
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

    it("handles deeply nested structures", function() {
        this.timeout(5000);
        let source = "describe('Root', () => {";
        for (let i = 0; i < 10; i++) {
            source += `describe("Level ${i}", () => {`;
        }
        source += "it('test', () => {});";
        for (let i = 0; i < 10; i++) {
            source += "});";
        }
        source += "});";
        
        const parser = new TestParser(source);
        const blocks = parser.parseBlocks();
        assert.ok(blocks.length === 12); // 11 describes + 1 it
    });
});
