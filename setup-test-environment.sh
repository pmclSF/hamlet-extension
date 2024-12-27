#!/bin/bash

# Install required dependencies
echo "Installing dependencies..."
npm install --save-dev ts-node @vscode/test-electron

# Create test runner file in existing src/test directory
echo "Creating test runner..."
cat > ./src/test/runTest.ts << 'EOL'
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        // Point to the main test suite index
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        await runTests({ 
            extensionDevelopmentPath, 
            extensionTestsPath 
        });
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();
EOL

# Update package.json scripts
echo "Updating package.json..."
node -e '
const fs = require("fs");
const package = JSON.parse(fs.readFileSync("package.json", "utf8"));
package.scripts.test = "node ./out/test/runTest.js";
fs.writeFileSync("package.json", JSON.stringify(package, null, 2) + "\n");
'

# Update tsconfig to include both test directories if needed
echo "Updating tsconfig.json..."
node -e '
const fs = require("fs");
const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
if (!tsconfig.include) {
    tsconfig.include = [];
}
const requiredPaths = ["src/**/*", "test/**/*"];
requiredPaths.forEach(path => {
    if (!tsconfig.include.includes(path)) {
        tsconfig.include.push(path);
    }
});
fs.writeFileSync("tsconfig.json", JSON.stringify(tsconfig, null, 2) + "\n");
'

echo "Setup complete! You can now run tests with 'npm test'"