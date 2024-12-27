#!/bin/bash

# Create mocha configuration file
echo "Creating .mocharc.json..."
cat > ./.mocharc.json << 'EOL'
{
    "require": "ts-node/register",
    "extension": ["ts"],
    "spec": "./test/**/*.test.ts",
    "ui": "bdd",
    "timeout": 10000
}
EOL

# Update package.json scripts
echo "Updating package.json..."
node -e '
const fs = require("fs");
const package = JSON.parse(fs.readFileSync("package.json", "utf8"));
package.scripts = {
    ...package.scripts,
    "test": "mocha"
};
fs.writeFileSync("package.json", JSON.stringify(package, null, 2) + "\n");
'

# Create basic test file
echo "Creating parser test..."
mkdir -p ./test/suite/core
cat > ./test/suite/core/parser.test.ts << 'EOL'
import { expect } from 'chai';

describe('Parser Tests', () => {
    it('should run a basic test', () => {
        expect(true).to.equal(true);
    });
});
EOL

# Create tsconfig.test.json for test configuration
echo "Creating test TypeScript configuration..."
cat > ./tsconfig.test.json << 'EOL'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "types": ["mocha", "node", "chai"]
  },
  "include": [
    "test/**/*.ts"
  ]
}
EOL

# Make sure required dependencies are installed
echo "Installing dependencies..."
npm install --save-dev \
    mocha \
    chai \
    @types/mocha \
    @types/chai \
    @types/node \
    ts-node \
    typescript

echo "Setup complete! Try running:"
echo "npm test"