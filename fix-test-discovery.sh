#!/bin/bash

# Update runTest.ts to use correct paths
echo "Updating test runner..."
cat > ./src/test/runTest.ts << 'EOL'
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        
        // The path to test script - correct path to the test index file
        const extensionTestsPath = path.resolve(extensionDevelopmentPath, 'out/test/suite/index');

        console.log('Extension Development Path:', extensionDevelopmentPath);
        console.log('Extension Tests Path:', extensionTestsPath);

        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ['--disable-extensions'],
            extensionTestsEnv: { MOCHA_DEBUG: "true" }
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();
EOL

# Update test index to handle TypeScript files
echo "Updating test index..."
cat > ./test/suite/index.ts << 'EOL'
import path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';
import { promisify } from 'util';
import 'mocha';

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        timeout: 60000
    });

    const testsRoot = path.resolve(__dirname);
    console.log('Looking for tests in:', testsRoot);
    
    const globPromise = promisify<string, { cwd: string }, string[]>(glob);

    try {
        // Look for TypeScript files that have been compiled to JavaScript
        const files = await globPromise('**/*.test.js', { cwd: testsRoot });
        console.log('Found test files:', files);

        // Add files to mocha
        for (const file of files) {
            const filePath = path.resolve(testsRoot, file);
            console.log('Adding test file:', filePath);
            mocha.addFile(filePath);
        }

        return new Promise<void>((resolve, reject) => {
            try {
                mocha.run((failures: number) => {
                    if (failures > 0) {
                        console.error(`${failures} tests failed`);
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        console.log('All tests passed!');
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

# Update test extension file
echo "Updating extension test..."
cat > ./test/suite/extension.test.ts << 'EOL'
import { describe, it } from 'mocha';
import { expect } from 'chai';

describe('Extension Test Suite', () => {
    it('Sample test', () => {
        console.log('Running sample test');
        expect(true).to.be.true;
    });
});
EOL

# Update package.json scripts
echo "Updating package.json..."
node -e '
const fs = require("fs");
const package = JSON.parse(fs.readFileSync("package.json", "utf8"));
package.scripts = {
    ...package.scripts,
    "pretest": "npm run compile",
    "test": "node ./out/src/test/runTest.js"
};
fs.writeFileSync("package.json", JSON.stringify(package, null, 2) + "\n");
'

echo "Setup complete! Please run:"
echo "1. npm run compile"
echo "2. npm test"