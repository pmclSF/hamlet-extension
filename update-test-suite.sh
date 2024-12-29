#!/bin/bash

# update_test_suite.sh

echo "Starting test suite update..."

# Create backup of current test directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp -r src/test/suite "test_backup_${TIMESTAMP}"
echo "Created backup in test_backup_${TIMESTAMP}"

# Ensure directories exist
mkdir -p src/test/suite

# Function to create or update a file
create_or_update_file() {
    local file_path=$1
    local content=$2
    echo "Updating $file_path..."
    echo "$content" > "$file_path"
}

# Create test helpers
TEST_HELPERS='import * as vscode from "vscode";
import * as assert from "assert";

export async function openTestDocument(content: string): Promise<vscode.TextDocument> {
    const document = await vscode.workspace.openTextDocument({
        content,
        language: "typescript"
    });
    await vscode.window.showTextDocument(document);
    return document;
}

export function assertBlockStructure(blocks: any[], expectedLength: number, message?: string) {
    assert.strictEqual(blocks.length, expectedLength, message || `Expected ${expectedLength} blocks`);
}

export async function executeCommandWithRetry(command: string, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
        try {
            await vscode.commands.executeCommand(command);
            return;
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}'

create_or_update_file "src/test/suite/test-helpers.ts" "$TEST_HELPERS"

# Update core parser tests
PARSER_TESTS='import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { TestParser } from "../../parsers/parser";
import { openTestDocument, assertBlockStructure } from "./test-helpers";

describe("Parser Tests", () => {
    describe("Framework Detection", () => {
        it("detects Cypress framework", () => {
            const source = `describe("CypressTest", () => { it("test", () => { cy.visit("/"); }); });`;
            const parser = new TestParser(source);
            assert.strictEqual(parser.detectFramework(), "cypress");
        });

        it("detects Playwright framework", () => {
            const source = `import { test } from "@playwright/test";
                test("PlaywrightTest", async ({ page }) => { await page.goto("/"); });`;
            const parser = new TestParser(source);
            assert.strictEqual(parser.detectFramework(), "playwright");
        });

        it("handles mixed framework signals", () => {
            const source = `describe("Mixed", () => {
                it("test", () => { cy.visit("/"); });
                test("pw", async ({ page }) => {});
            });`;
            const parser = new TestParser(source);
            const framework = parser.detectFramework();
            assert.ok(framework === "cypress" || framework === "playwright");
        });
    });

    describe("Block Parsing", () => {
        it("parses nested blocks correctly", () => {
            const source = `describe("Outer", () => {
                describe("Inner", () => {
                    it("test", () => {});
                });
            });`;
            const parser = new TestParser(source);
            const blocks = parser.parseBlocks();
            assertBlockStructure(blocks, 3);
        });

        it("handles empty blocks", () => {
            const parser = new TestParser("");
            const blocks = parser.parseBlocks();
            assert.strictEqual(blocks.length, 0);
        });
    });
});'

create_or_update_file "src/test/suite/parser.test.ts" "$PARSER_TESTS"

# Create integration tests
INTEGRATION_TESTS='import { describe, it, beforeEach, afterEach } from "mocha";
import { strict as assert } from "assert";
import * as vscode from "vscode";
import { openTestDocument, executeCommandWithRetry } from "./test-helpers";

describe("Integration Tests", () => {
    let documents: vscode.TextDocument[] = [];

    beforeEach(async () => {
        await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    });

    afterEach(async () => {
        for (const doc of documents) {
            try {
                await vscode.workspace.fs.delete(doc.uri);
            } catch (e) {
                console.warn(`Cleanup failed for ${doc.uri}`);
            }
        }
        documents = [];
    });

    it("handles concurrent document processing", async function() {
        this.timeout(10000);
        
        const doc1 = await openTestDocument(
            `describe("Test1", () => { it("test", () => { cy.visit("/"); }); });`
        );
        const doc2 = await openTestDocument(
            `test.describe("Test2", () => { test("test", async ({page}) => {}); });`
        );
        
        documents.push(doc1, doc2);
        
        const results = await Promise.all([
            executeCommandWithRetry("hamlet.convertToPlaywright"),
            executeCommandWithRetry("hamlet.convertToCypress")
        ]);
        
        assert.ok(doc1.getText().includes("test.describe"));
        assert.ok(doc2.getText().includes("describe"));
    });

    it("preserves document state during rapid conversions", async function() {
        this.timeout(5000);
        
        const doc = await openTestDocument(
            `describe("RapidTest", () => { it("test", () => {}); });`
        );
        documents.push(doc);
        
        await Promise.all(Array(3).fill(0).map(() => 
            executeCommandWithRetry("hamlet.convertToPlaywright")
        ));
        
        const finalText = doc.getText();
        assert.ok(finalText.includes("test.describe"));
        assert.ok(finalText.includes("async"));
    });
});'

create_or_update_file "src/test/suite/integration.test.ts" "$INTEGRATION_TESTS"

# Create edge case tests
EDGE_CASE_TESTS='import { describe, it } from "mocha";
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
});'

create_or_update_file "src/test/suite/edge-cases.test.ts" "$EDGE_CASE_TESTS"

# Update test environment setup
SETUP_CODE='import * as path from "path";
import * as Mocha from "mocha";
import { glob } from "glob";

export async function run(): Promise<void> {
    const mocha = new Mocha({
        ui: "bdd",
        color: true,
        timeout: 10000
    });

    const testsRoot = path.resolve(__dirname, "..");
    const files = await glob("**/**.test.js", { cwd: testsRoot });

    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    return new Promise((resolve, reject) => {
        try {
            mocha.run(failures => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}'

create_or_update_file "src/test/suite/index.ts" "$SETUP_CODE"

echo "Test suite update complete!"