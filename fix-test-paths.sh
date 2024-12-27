#!/bin/bash

# Update runTest.ts with absolute paths
echo "Updating test runner..."
cat > ./src/test/runTest.ts << 'EOL'
import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import { fileURLToPath } from 'url';

async function main() {
    try {
        // Get absolute paths using import.meta.dirname
        const projectRoot = path.resolve(__dirname, '../..');
        const extensionDevelopmentPath = projectRoot;
        const extensionTestsPath = path.resolve(projectRoot, 'out/src/test/suite/index');

        console.log('Project Root:', projectRoot);
        console.log('Extension Development Path:', extensionDevelopmentPath);
        console.log('Extension Tests Path:', extensionTestsPath);

        // Verify path exists
        const fs = require('fs');
        if (!fs.existsSync(extensionTestsPath + '.js')) {
            console.error('Test file not found at:', extensionTestsPath + '.js');
            process.exit(1);
        }

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

# Create all required directories
echo "Creating directory structure..."
mkdir -p ./out/src/test/suite

# Update the test suite index
echo "Updating test suite index..."
cat > ./src/test/suite/index.ts << 'EOL'
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
    console.log('Tests root:', testsRoot);

    try {
        // Look for test files
        const files = await promisify(glob)('**/**.test.js', { cwd: testsRoot });
        console.log('Found test files:', files);

        // Add files to the test suite
        files.forEach(f => {
            const filePath = path.resolve(testsRoot, f);
            console.log('Adding test file:', filePath);
            mocha.addFile(filePath);
        });

        return new Promise<void>((resolve, reject) => {
            try {
                // Run the mocha test
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

# Create a basic test file
echo "Creating test file..."
cat > ./src/test/suite/extension.test.ts << 'EOL'
import { describe, it } from 'mocha';
import { expect } from 'chai';

describe('Extension Test Suite', () => {
    it('Sample test', () => {
        console.log('Running sample test');
        expect(true).to.be.true;
    });
});
EOL

# Update package.json
echo "Updating package.json..."
node -e '
const fs = require("fs");
const package = JSON.parse(fs.readFileSync("package.json", "utf8"));
package.scripts = {
    ...package.scripts,
    "test": "node ./out/src/test/runTest.js",
    "pretest": "tsc -p ./"
};
fs.writeFileSync("package.json", JSON.stringify(package, null, 2) + "\n");
'

# Clean and compile
echo "Cleaning and compiling..."
rm -rf ./out
npm run compile

echo "Setup complete! Please verify the compiled files exist in ./out directory"
ls -la ./out/src/test/suite/

echo "Running tests..."
npm test