import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { TestParser } from "../../parsers/parser";
import { CypressToPlaywrightConverter } from "../../converters/cypress/to-playwright";
import { PlaywrightToTestRailConverter } from "../../converters/playwright/to-testrail";

describe("Error Handling and Edge Cases", () => {
    describe("Parser Error Handling", () => {
        it("handles unclosed blocks gracefully", () => {
            const source = `
                describe("Unclosed Suite", () => {
                    it("Unclosed Test", () => {
                        cy.visit("/test")
            `;
            const parser = new TestParser(source);
            const blocks = parser.parseBlocks();
            assert.ok(Array.isArray(blocks), "Should return array even with unclosed blocks");
            assert.ok(blocks.length > 0, "Should parse partial blocks");
            
            const firstBlock = blocks[0];
            assert.strictEqual(firstBlock.type, 'suite', "Should identify suite type");
            assert.strictEqual(firstBlock.title, 'Unclosed Suite', "Should extract suite title");
        });

        it("handles malformed async/await", () => {
            const source = `
                test("Bad async", async ({ page } => {
                    await page.goto("/test")
                    await await page.click(".btn")
                });
            `;
            const parser = new TestParser(source);
            assert.doesNotThrow(() => parser.parseBlocks());
        });
    });

    describe("Converter Error Handling", () => {
        it("handles unsupported commands", () => {
            const source = `
                describe("Test", () => {
                    it("uses unsupported command", () => {
                        cy.customCommand();
                        cy.anotherUnknownCommand();
                        cy.visit("/test");
                    });
                });
            `;
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            
            // Check conversion success
            assert.ok(result.success, "Should succeed even with unsupported commands");
            
            // Check warnings array
            assert.ok(Array.isArray(result.warnings), "Should have warnings array");
            assert.ok(result.warnings.length > 0, "Should include warnings");
            
            // Check specific warnings
            assert.ok(
                result.warnings.some(w => w.includes('customCommand')),
                "Should warn about customCommand"
            );
            assert.ok(
                result.warnings.some(w => w.includes('anotherUnknownCommand')),
                "Should warn about anotherUnknownCommand"
            );

            // Check that supported commands are still converted
            assert.ok(
                result.convertedCode.includes('await page.goto'),
                "Should convert supported commands"
            );
            
            // Check that original structure is maintained
            assert.ok(
                result.convertedCode.includes('test.describe'),
                "Should maintain test structure"
            );
        });

        it("handles empty input", () => {
            const source = '';
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            
            assert.ok(result.success, "Should handle empty input");
            assert.strictEqual(result.warnings?.length, 0, "Should have no warnings for empty input");
        });

        it("handles malformed input", () => {
            const source = 'this is not a valid test file';
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            
            assert.ok(result.success, "Should handle malformed input");
            assert.strictEqual(
                result.convertedCode,
                source,
                "Should return original content for non-test files"
            );
        });

        it("preserves indentation", () => {
            const source = `
                describe("Test", () => {
                    it("test case", () => {
                        cy.visit("/test");
                    });
                });
            `;
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            
            assert.ok(result.success, "Should convert successfully");
            assert.ok(
                result.convertedCode.includes('    await page.goto'),
                "Should preserve indentation"
            );
        });

        it("handles multiple unsupported commands in one line", () => {
            const source = `cy.customCommand().anotherCommand().visit('/test');`;
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            
            assert.ok(result.success, "Should handle chained commands");
            assert.ok(
                (result.warnings && result.warnings.length >= 2),
                "Should warn about multiple unsupported commands"
            );
        });
    });
});