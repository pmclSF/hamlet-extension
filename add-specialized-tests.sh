#!/bin/bash

# add_specialized_tests.sh

echo "Adding specialized test suites..."

# Helper function to safely write files
write_file() {
    local file_path=$1
    local content=$2
    echo "Writing to $file_path..."
    echo "$content" > "$file_path"
}

# Converter-specific tests
read -r -d '' CONVERTER_TESTS << 'EOL'
import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { CypressToPlaywrightConverter } from "../../converters/cypress/to-playwright";
import { PlaywrightToTestRailConverter } from "../../converters/playwright/to-testrail";
import { TestRailToCypressConverter } from "../../converters/testrail/to-cypress";

describe("Framework-Specific Converter Tests", () => {
    describe("Cypress to Playwright", () => {
        it("converts cy.visit correctly", () => {
            const source = 'describe("test", () => { it("test", () => { cy.visit("/page"); }); });';
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes('page.goto("/page")'));
        });

        it("converts cy.get and click correctly", () => {
            const source = 'describe("test", () => { it("test", () => { cy.get(".btn").click(); }); });';
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes('page.locator(".btn").click()'));
        });

        it("converts cy.contains correctly", () => {
            const source = 'describe("test", () => { it("test", () => { cy.contains("text"); }); });';
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes('page.getByText("text")'));
        });

        it("handles complex assertions", () => {
            const source = 'describe("test", () => { it("test", () => { cy.get("element").should("be.visible").and("have.text", "test"); }); });';
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes("expect"));
            assert.ok(result.convertedCode.includes("toBeVisible"));
        });
    });

    describe("Playwright to TestRail", () => {
        it("converts page actions to steps", () => {
            const source = `
                test("navigation", async ({ page }) => {
                    await page.goto("/test");
                    await page.click(".button");
                });
            `;
            const converter = new PlaywrightToTestRailConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes("step('Navigate to"));
            assert.ok(result.convertedCode.includes("step('Click"));
        });

        it("handles expect assertions", () => {
            const source = `test("test", async ({ page }) => { expect(page.locator(".element")).toBeVisible(); });`;
            const converter = new PlaywrightToTestRailConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.convertedCode.includes("step('Verify"));
        });
    });
});
EOL

write_file "src/test/suite/converter-specific.test.ts" "$CONVERTER_TESTS"

# Performance tests
read -r -d '' PERFORMANCE_TESTS << 'EOL'
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
EOL

write_file "src/test/suite/performance.test.ts" "$PERFORMANCE_TESTS"

# AST tests
read -r -d '' AST_TESTS << 'EOL'
import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { ASTHelper } from "../../utils/ast-helpers";

describe("AST Tests", () => {
    describe("Node Creation", () => {
        it("creates test nodes correctly", () => {
            const node = ASTHelper.createTestNode("Test Title", "test body");
            assert.strictEqual(node.type, "test");
            assert.strictEqual(node.name, "Test Title");
            assert.strictEqual(node.body, "test body");
            assert.ok(Array.isArray(node.children));
        });

        it("creates suite nodes correctly", () => {
            const node = ASTHelper.createSuiteNode("Suite Title");
            assert.strictEqual(node.type, "suite");
            assert.strictEqual(node.name, "Suite Title");
            assert.ok(Array.isArray(node.children));
        });
    });

    describe("AST Traversal", () => {
        it("traverses nodes in correct order", () => {
            const root = ASTHelper.createSuiteNode("Root");
            const child1 = ASTHelper.createSuiteNode("Child 1");
            const child2 = ASTHelper.createTestNode("Test 1", "body");
            
            ASTHelper.addChildNode(root, child1);
            ASTHelper.addChildNode(child1, child2);
            
            const visited: string[] = [];
            ASTHelper.traverse(root, (node) => {
                visited.push(node.name || "");
            });
            
            assert.deepStrictEqual(visited, ["Root", "Child 1", "Test 1"]);
        });
    });
});
EOL

write_file "src/test/suite/ast.test.ts" "$AST_TESTS"

# Command tests
read -r -d '' COMMAND_TESTS << 'EOL'
import { describe, it, before } from "mocha";
import { strict as assert } from "assert";
import * as vscode from "vscode";
import { openTestDocument, executeCommandWithRetry } from "./test-helpers";

describe("Command Tests", () => {
    before(async () => {
        const ext = vscode.extensions.getExtension("YourPublisher.hamlet");
        if (ext) {
            await ext.activate();
        }
    });

    it("convertToPlaywright command works", async function() {
        this.timeout(5000);
        const doc = await openTestDocument(`
            describe("Test", () => {
                it("test", () => {
                    cy.visit("/test");
                });
            });
        `);
        
        await executeCommandWithRetry("hamlet.convertToPlaywright");
        const text = doc.getText();
        assert.ok(text.includes("test.describe"));
        assert.ok(text.includes("page.goto"));
    });

    it("convertToCypress command works", async function() {
        this.timeout(5000);
        const doc = await openTestDocument(`
            test.describe("Test", () => {
                test("test", async ({ page }) => {
                    await page.goto("/test");
                });
            });
        `);
        
        await executeCommandWithRetry("hamlet.convertToCypress");
        const text = doc.getText();
        assert.ok(text.includes("describe("));
        assert.ok(text.includes("cy.visit"));
    });
});
EOL

write_file "src/test/suite/commands.test.ts" "$COMMAND_TESTS"

echo "Specialized test suites added successfully!"