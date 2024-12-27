#!/bin/bash

# Update main test runner
echo "Updating test runner..."
cat > ./test/runTest.ts << 'EOL'
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '..');
        const extensionTestsPath = path.resolve(__dirname, './suite');

        console.log('Extension Development Path:', extensionDevelopmentPath);
        console.log('Extension Tests Path:', extensionTestsPath);

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ['--disable-extensions']
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();
EOL

# Update test suite index
echo "Updating test suite index..."
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
    const globAsync = promisify<string, { cwd: string }, string[]>(glob);

    try {
        // Look for compiled test files
        console.log('Looking for tests in:', testsRoot);
        const files = await globAsync('**/*.test.js', { cwd: testsRoot });
        console.log('Found test files:', files);

        // Add files to mocha
        for (const file of files) {
            const filePath = path.resolve(testsRoot, file);
            console.log('Adding test file:', filePath);
            mocha.addFile(filePath);
        }

        // Run mocha
        return new Promise<void>((resolve, reject) => {
            try {
                mocha.run(failures => {
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

# Create test setup helper
echo "Creating test helper..."
mkdir -p ./test/suite/helpers
cat > ./test/suite/helpers/test-setup.ts << 'EOL'
import { expect } from 'chai';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as path from 'path';

// Utility function to get sample file paths
export function getSamplePath(filename: string): string {
    return path.resolve(__dirname, '../../samples', filename);
}

// VS Code test helpers
export async function openTestDocument(content: string, language = 'typescript'): Promise<vscode.TextDocument> {
    return await vscode.workspace.openTextDocument({
        language,
        content
    });
}

// Export commonly used test dependencies
export {
    expect,
    vscode,
    sinon
};
EOL

# Update package.json scripts
echo "Updating package.json..."
node -e '
const fs = require("fs");
const package = JSON.parse(fs.readFileSync("package.json", "utf8"));
package.scripts = {
    ...package.scripts,
    "test": "node ./out/test/runTest.js",
    "test:compile": "tsc -p ./",
    "test:watch": "tsc -watch -p ./",
    "pretest": "npm run test:compile"
};
fs.writeFileSync("package.json", JSON.stringify(package, null, 2) + "\n");
'

# Create mocha config
echo "Creating mocha config..."
cat > ./.mocharc.json << 'EOL'
{
    "require": "ts-node/register",
    "extension": ["ts"],
    "watch-extensions": ["ts"],
    "recursive": true,
    "timeout": 60000
}
EOL

# Ensure required dev dependencies
echo "Installing dependencies..."
npm install --save-dev \
    mocha \
    chai \
    sinon \
    @types/mocha \
    @types/chai \
    @types/sinon \
    ts-node \
    @vscode/test-electron

echo "Setup complete! You can now run:"
echo "npm test        # Run all tests once"
echo "npm run test:watch # Watch mode for development"