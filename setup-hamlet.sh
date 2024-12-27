#!/bin/bash

# Create root directory
mkdir hamlet && cd hamlet

# Create main directories
mkdir -p src/{converters/{cypress,playwright,testrail},utils,test-patterns} \
        test/{suite,unit} \
        .vscode

# Create source files
touch src/extension.ts \
      src/frameworks.ts \
      src/types.ts \
      src/utils/{parser.ts,ast-helpers.ts} \
      src/converters/base-converter.ts \
      src/converters/cypress/{to-playwright.ts,to-testrail.ts} \
      src/converters/playwright/{to-cypress.ts,to-testrail.ts} \
      src/converters/testrail/{to-cypress.ts,to-playwright.ts} \
      src/test-patterns/{cypress-patterns.ts,playwright-patterns.ts,testrail-patterns.ts}

# Create test files
touch test/suite/{extension.test.ts,index.ts} \
      test/unit/{converters.test.ts,parser.test.ts}

# Create config files
touch .gitignore \
      .eslintrc.json \
      .prettierrc \
      package.json \
      tsconfig.json \
      webpack.config.js \
      README.md

# Create VS Code config files
touch .vscode/{launch.json,tasks.json}

# Add basic .gitignore content
cat << 'EOF' > .gitignore
out/
node_modules/
*.vsix
.DS_Store
EOF

# Initialize git repository
git init

# Initialize npm and install dependencies
npm init -y
npm install --save-dev @types/node @types/vscode typescript @types/mocha mocha
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin

echo "Hamlet project structure has been created successfully!"