#!/bin/bash

# Create test helper for common imports and setup
echo "Creating test helper..."
mkdir -p ./test/suite/helpers
cat > ./test/suite/helpers/test-setup.ts << 'EOL'
import { expect } from 'chai';
import * as vscode from 'vscode';
import * as sinon from 'sinon';

// Common test utilities
export async function createTestDocument(content: string, language = 'javascript'): Promise<vscode.TextDocument> {
    return await vscode.workspace.openTextDocument({
        content,
        language
    });
}

// Export commonly used test dependencies
export {
    expect,
    vscode,
    sinon
};
EOL

# Update extension.test.ts to use BDD style
echo "Updating extension test..."
cat > ./test/suite/extension.test.ts << 'EOL'
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('Extension Test Suite', () => {
    it('Sample test', () => {
        expect([1, 2, 3].indexOf(5)).to.equal(-1);
        expect([1, 2, 3].indexOf(0)).to.equal(-1);
    });
});
EOL

# Create proper mocha configuration
echo "Creating .mocharc.json..."
cat > ./.mocharc.json << 'EOL'
{
    "require": [
        "ts-node/register",
        "source-map-support/register"
    ],
    "extension": ["ts"],
    "spec": [
        "test/**/*.test.ts",
        "src/**/*.test.ts"
    ],
    "ui": "bdd",
    "timeout": 60000,
    "recursive": true,
    "exit": true
}
EOL

# Update index.ts test runner
echo "Updating test runner..."
cat > ./test/suite/index.ts << 'EOL'
import path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';
import { promisify } from 'util';

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        timeout: 60000
    });

    const testsRoot = path.resolve(__dirname);
    const globPromise = promisify<string, { cwd: string }, string[]>(glob);

    try {
        // Look for TypeScript test files
        const files = await globPromise('**/*.test.ts', { cwd: testsRoot });
        console.log('Found test files:', files);

        // Add test files to Mocha
        for (const file of files) {
            const filePath = path.resolve(testsRoot, file);
            console.log('Adding test file:', filePath);
            mocha.addFile(filePath);
        }

        return new Promise<void>((resolve, reject) => {
            try {
                // Register global test dependencies
                global.describe = mocha.suite.describe.bind(mocha.suite);
                global.it = mocha.suite.it.bind(mocha.suite);
                global.before = mocha.suite.before.bind(mocha.suite);
                global.after = mocha.suite.after.bind(mocha.suite);
                global.beforeEach = mocha.suite.beforeEach.bind(mocha.suite);
                global.afterEach = mocha.suite.afterEach.bind(mocha.suite);

                mocha.run((failures: number) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                console.error('Error running tests:', err);
                reject(err);
            }
        });
    } catch (err) {
        console.error('Error loading test files:', err);
        throw err;
    }
}
EOL

# Create converter test template
echo "Creating converter test..."
cat > ./test/suite/core/converter.test.ts << 'EOL'
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { TestConverter } from '../../../src/converters/converter';

describe('Test Converter', () => {
    describe('Cypress to Playwright', () => {
        it('should convert basic test structure', () => {
            const cypress = `
                describe('Test Suite', () => {
                    it('should work', () => {
                        cy.visit('/test');
                    });
                });
            `;
            const converter = new TestConverter();
            const result = converter.convertToPlaywright(cypress);
            expect(result).to.include('test.describe');
            expect(result).to.include('test(');
            expect(result).to.include('page.goto');
        });
    });

    describe('Playwright to TestRail', () => {
        it('should convert basic test structure', () => {
            const playwright = `
                test.describe('Test Suite', () => {
                    test('should work', async ({ page }) => {
                        await page.goto('/test');
                    });
                });
            `;
            const converter = new TestConverter();
            const result = converter.convertToTestRail(playwright);
            expect(result).to.include('suite(');
            expect(result).to.include('testCase(');
            expect(result).to.include('step(');
        });
    });
});
EOL

# Update package.json test scripts
echo "Updating package.json..."
node -e '
const fs = require("fs");
const package = JSON.parse(fs.readFileSync("package.json", "utf8"));
package.scripts = {
    ...package.scripts,
    "test": "node ./out/test/runTest.js",
    "test:unit": "mocha --config .mocharc.json \"test/**/*.test.ts\"",
    "test:integration": "mocha --config .mocharc.json \"test/**/*.test.ts\" --grep \"Integration\""
};
fs.writeFileSync("package.json", JSON.stringify(package, null, 2) + "\n");
'

# Ensure all required dependencies are installed
echo "Installing dependencies..."
npm install --save-dev \
    mocha \
    chai \
    sinon \
    @types/mocha \
    @types/chai \
    @types/sinon \
    @types/node \
    ts-node \
    source-map-support \
    @vscode/test-electron

echo "Setup complete! You can now run:"
echo "npm test        # Run all tests"
echo "npm run test:unit        # Run unit tests"
echo "npm run test:integration # Run integration tests"