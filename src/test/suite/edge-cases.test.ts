import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { TestParser } from "../../parsers/parser";
import { openTestDocument } from "./test-helpers";

describe("Edge Cases", () => {
    describe("Parser Edge Cases", () => {
        it("handles malformed input", () => {
            const source = `describe("Unclosed" => {`;
            const parser = new TestParser(source);
            const blocks = parser.parseBlocks();
            assert.ok(Array.isArray(blocks));
        });

        it("processes unicode characters", () => {
            const source = `describe("テスト", () => { it("テストケース", () => {}); });`;
            const parser = new TestParser(source);
            const blocks = parser.parseBlocks();
            assert.strictEqual(blocks[0].title, "テスト");
        });
    });

    describe("Performance", function() {
        this.timeout(5000);
        
        it("handles large files", () => {
            let source = "";
            for (let i = 0; i < 100; i++) {
                source += `describe("Suite${i}", () => {
                    it("test${i}", () => {});
                });\n`;
            }
            
            const start = performance.now();
            const parser = new TestParser(source);
            const blocks = parser.parseBlocks();
            const duration = performance.now() - start;
            
            assert.ok(duration < 1000);
            assert.ok(blocks.length > 0);
        });
    });
});
