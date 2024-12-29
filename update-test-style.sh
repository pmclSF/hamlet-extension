#!/bin/bash

echo "🔄 Updating test style to BDD..."

# Create backup directory
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="test_backup_$timestamp"
mkdir -p "$backup_dir"

# Backup existing test file
echo "📦 Creating backup in $backup_dir..."
cp src/test/suite/converters.test.ts "$backup_dir/"

# Update converters.test.ts with BDD style
echo "📝 Updating test file..."
cat > src/test/suite/converters.test.ts << 'EOF'
import { strict as assert } from 'assert';
import { CypressToPlaywrightConverter } from '../../converters/cypress/to-playwright';
import { PlaywrightToTestRailConverter } from '../../converters/playwright/to-testrail';

describe('Test Converter Unit Tests', () => {
    it('Converts Cypress to Playwright', () => {
        const cypressInput = `
            describe('Login Feature', () => {
                it('should login successfully', () => {
                    cy.visit('/login');
                    cy.get('#username').type('testuser');
                    cy.get('#password').type('password123');
                    cy.get('button[type="submit"]').click();
                });
            });
        `;

        const converter = new CypressToPlaywrightConverter(cypressInput);
        const result = converter.convertToTargetFramework();
        
        assert.ok(result.success, 'Conversion should succeed');
        assert.ok(result.convertedCode.includes('page.locator'), 'Should contain page.locator calls');
        assert.ok(result.convertedCode.includes('test.describe'), 'Should contain test.describe structure');
    });

    it('Converts Playwright to TestRail', () => {
        const playwrightInput = `
            test.describe('Login Feature', () => {
                test('should login successfully', async ({ page }) => {
                    await page.goto('/login');
                    await page.locator('#username').fill('testuser');
                    await page.locator('#password').fill('password123');
                    await page.locator('button[type="submit"]').click();
                });
            });
        `;

        const converter = new PlaywrightToTestRailConverter(playwrightInput);
        const result = converter.convertToTargetFramework();
        
        assert.ok(result.success, 'Conversion should succeed');
        assert.ok(result.convertedCode.includes('testCase'), 'Should contain TestRail testCase');
        assert.ok(result.convertedCode.includes('step'), 'Should contain TestRail steps');
    });

    it('Handles unsupported conversions gracefully', () => {
        const unsupportedInput = `
            function example() {
                console.log('This is unsupported');
            }
        `;

        const converter = new CypressToPlaywrightConverter(unsupportedInput);
        const result = converter.convertToTargetFramework();
        
        assert.ok(result.success, 'Should handle unsupported input gracefully');
        assert.deepStrictEqual(result.convertedCode.trim(), unsupportedInput.trim(), 'Should return input unchanged for unsupported content');
    });

    it('Includes appropriate warnings for complex conversions', () => {
        const complexInput = `
            describe('Complex Test', () => {
                it('uses advanced features', () => {
                    cy.intercept('POST', '/api/data').as('apiCall');
                    cy.wait('@apiCall');
                    cy.fixture('example.json').then((data) => {
                        // Use fixture data
                    });
                });
            });
        `;

        const converter = new CypressToPlaywrightConverter(complexInput);
        const result = converter.convertToTargetFramework();
        
        assert.ok(result.warnings && result.warnings.length > 0, 'Should include warnings for complex conversions');
    });
});
EOF

# Update mocha configuration if needed
echo "📝 Ensuring mocha config uses BDD..."
cat > .mocharc.json << 'EOF'
{
  "require": "ts-node/register",
  "extensions": ["ts", "tsx"],
  "spec": "src/test/suite/**/*.test.ts",
  "ui": "bdd",
  "timeout": 10000
}
EOF

# Clean and rebuild
echo "🧹 Cleaning and rebuilding..."
rm -rf out/
npm run compile

echo "✅ Update complete! You can now run the converter tests with:"
echo "mocha --config .mocharc.json \"src/test/suite/**/*.test.ts\" --grep \"Test Converter\""
echo ""
echo "Backups of modified files are stored in: $backup_dir"