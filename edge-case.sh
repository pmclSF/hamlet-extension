#!/bin/bash

# update_test_suite.sh
echo "Starting test suite update..."

# Create backup of current test directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "test_backup_${TIMESTAMP}"
cp -r src/test/suite/* "test_backup_${TIMESTAMP}/" 2>/dev/null || true
echo "Created backup in test_backup_${TIMESTAMP}"

# Ensure test directory exists
mkdir -p src/test/suite

# Function to write a file
write_file() {
    local file_path=$1
    local content=$2
    echo "Writing to $file_path..."
    mkdir -p "$(dirname "$file_path")"
    echo "$content" > "$file_path"
}

# Function to setup directory structure
setup_directories() {
    echo "Setting up directory structure..."
    mkdir -p src/test/suite
}

# Start setup
setup_directories

# Add test helper functions
read -r -d '' TEST_HELPERS << 'EOL'
import * as vscode from "vscode";
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
}
EOL

write_file "src/test/suite/test-helpers.ts" "$TEST_HELPERS"

# Add error handling tests
read -r -d '' ERROR_TESTS << 'EOL'
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
                    });
                });
            `;
            const converter = new CypressToPlaywrightConverter(source);
            const result = converter.convertToTargetFramework();
            assert.ok(result.success, "Should succeed even with unsupported commands");
            assert.ok(result.warnings.length > 0, "Should include warnings");
        });
    });
});
EOL

write_file "src/test/suite/error-handling.test.ts" "$ERROR_TESTS"

# Add integration tests
read -r -d '' INTEGRATION_TESTS << 'EOL'
import { describe, it, beforeEach, afterEach } from "mocha";
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

    it("handles concurrent conversions", async function() {
        this.timeout(10000);
        
        const doc = await openTestDocument(`
            describe("Test", () => {
                it("test", () => {
                    cy.visit("/test");
                });
            });
        `);
        documents.push(doc);
        
        const conversions = Array(3).fill(0).map(() => 
            executeCommandWithRetry("hamlet.convertToPlaywright")
        );

        await Promise.all(conversions);
        
        const finalText = doc.getText();
        assert.ok(finalText.includes("test.describe"));
        assert.ok(finalText.includes("page.goto"));
    });
});
EOL

write_file "src/test/suite/integration.test.ts" "$INTEGRATION_TESTS"

# Add performance tests
read -r -d '' PERFORMANCE_TESTS << 'EOL'
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
EOL

write_file "src/test/suite/performance.test.ts" "$PERFORMANCE_TESTS"

echo "Test suite update completed successfully!"