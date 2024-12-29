#!/bin/bash

echo "🔧 Updating VSCode test configuration..."

# Backup current files
echo "📦 Creating backups..."
timestamp=$(date +%Y%m%d_%H%M%S)
mkdir -p "backup_$timestamp"
cp package.json "backup_$timestamp/"
cp src/test/runTest.ts "backup_$timestamp/" 2>/dev/null || true

# Update package.json
echo "📝 Updating package.json..."
cat > package.json << 'EOF'
{
  "name": "hamlet",
  "displayName": "hamlet",
  "description": "",
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.96.0"
  },
  "categories": [
    "Other"
  ],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "commands": []
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "tsc -p ./",
    "lint": "eslint src/**/*.ts",
    "test": "node ./out/test/runTest.js",
    "test:unit": "mocha --config .mocharc.json \"test/**/*.test.ts\"",
    "test:integration": "mocha --config .mocharc.json \"test/**/*.test.ts\" --grep \"Integration\"",
    "test:compile": "tsc -p ./",
    "test:watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/chai": "^5.0.1",
    "@types/cypress": "^0.1.6",
    "@types/glob": "^7.2.0",
    "@types/mocha": "^10.0.10",
    "@types/node": "^18.19.68",
    "@types/sinon": "^17.0.3",
    "@types/vscode": "^1.96.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "@vscode/test-electron": "^2.4.1",
    "chai": "^5.1.2",
    "cypress": "^13.17.0",
    "eslint": "^8.57.1",
    "glob": "^10.4.5",
    "mocha": "^10.8.2",
    "sinon": "^19.0.2",
    "source-map-support": "^0.5.21",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.18.2",
    "minimatch": "^5.1.6"
  }
}
EOF

# Update runTest.ts
echo "📝 Updating src/test/runTest.ts..."
mkdir -p src/test
cat > src/test/runTest.ts << 'EOF'
import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import { glob } from 'glob';
import { promisify } from 'util';

const globPromise = promisify<string, object, string[]>(glob);

async function main() {
    try {
        const projectRoot = process.cwd();
        const extensionDevelopmentPath = projectRoot;
        const extensionTestsPath = path.resolve(projectRoot, 'out/test/suite/index.js');

        // Add file system check
        const fs = require('fs');
        console.log('Checking if test path exists:', extensionTestsPath);
        console.log('Path exists:', fs.existsSync(extensionTestsPath));
        console.log('Directory contents:', fs.readdirSync(path.dirname(extensionTestsPath)));

        // Try to require the index file directly
        console.log('🔍 Attempting to require index file...');
        try {
            const indexModule = require(extensionTestsPath);
            console.log('📦 Index module contents:', Object.keys(indexModule));
            if (indexModule.run) {
                console.log('✅ Found run function in module');
            } else {
                console.log('❌ No run function found in module');
            }
        } catch (err) {
            console.error('💥 Error requiring index file:', err);
        }

        console.log('Project Root:', projectRoot);
        console.log('Extension Development Path:', extensionDevelopmentPath);
        console.log('Extension Tests Path:', extensionTestsPath);

        const testsRoot = path.resolve(projectRoot, 'out/test/suite');
        const testFiles = await globPromise('**/*.test.js', { cwd: testsRoot });
        console.log('Test root exists:', fs.existsSync(testsRoot));
        console.log('Discovered Test Files:', testFiles);

        // Run the tests with verbose logging
        console.log('🚀 Starting test run...');
        const results = await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                '--disable-gpu',
                '--headless',
                '--verbose'
            ],
            extensionTestsEnv: {
                MOCHA_REPORTER: 'spec',
                MOCHA_TIMEOUT: '60000',
                DEBUG: '*',
                NODE_DEBUG: 'vscode-test,mocha',
                VSCODE_DEBUG_EXTENSION_HOST: 'true'
            }
        });
        console.log('✅ Test run completed with results:', results);

    } catch (err) {
        console.error('Failed to run tests:', err);
        if (err instanceof Error) {
            console.error('Error stack:', err.stack);
        }
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Unhandled error in main:', err);
    process.exit(1);
});
EOF

# Clean and reinstall node modules
echo "🧹 Cleaning node_modules..."
rm -rf node_modules package-lock.json

# Run npm install
echo "📦 Installing dependencies..."
npm install

echo "✅ Setup complete! Backups stored in backup_$timestamp/"
echo "Run 'npm test' to try the updated configuration."