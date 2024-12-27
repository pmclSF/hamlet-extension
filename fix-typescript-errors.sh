#!/bin/bash

# Update the test suite index with proper TypeScript types
echo "Updating test suite index..."
cat > ./src/test/suite/index.ts << 'EOL'
import * as path from 'path';
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
        // Define the type for glob promise
        const globPromise = promisify<string, object, string[]>(glob);
        
        // Look for test files
        const files = await globPromise('**/**.test.js', { cwd: testsRoot });
        console.log('Found test files:', files);

        // Add files to the test suite
        for (const file of files) {
            const filePath = path.resolve(testsRoot, file);
            console.log('Adding test file:', filePath);
            mocha.addFile(filePath);
        }

        // Run the mocha tests
        return new Promise<void>((resolve, reject) => {
            try {
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

# Update runTest.ts to use proper directory calculation
echo "Updating test runner..."
cat > ./src/test/runTest.ts << 'EOL'
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // Use process.cwd() to get the actual project root
        const projectRoot = process.cwd();
        const extensionDevelopmentPath = projectRoot;
        const extensionTestsPath = path.resolve(projectRoot, 'out/src/test/suite/index');

        console.log('Project Root:', projectRoot);
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

# Clean up and recompile
echo "Cleaning up and recompiling..."
rm -rf ./out
npm run compile

echo "Setup complete! Running tests..."
npm test