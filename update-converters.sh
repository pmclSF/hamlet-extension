#!/bin/bash

echo "🔄 Updating converter implementation..."

# Create backup directory
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="converter_backup_$timestamp"
mkdir -p "$backup_dir"

# Backup existing files
echo "📦 Creating backups in $backup_dir..."
cp src/test/suite/converters.test.ts "$backup_dir/"
cp src/converters/converter.ts "$backup_dir/"

# Update converters.test.ts with new implementation
echo "📝 Updating test file..."
cat > src/test/suite/converters.test.ts << 'EOF'
import { strict as assert } from 'assert';
import { CypressToPlaywrightConverter } from '../../converters/cypress/to-playwright';
import { PlaywrightToTestRailConverter } from '../../converters/playwright/to-testrail';

suite('Test Converter Unit Tests', () => {
    test('Converts Cypress to Playwright', () => {
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

    test('Converts Playwright to TestRail', () => {
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

    test('Handles unsupported conversions gracefully', () => {
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

    test('Includes appropriate warnings for complex conversions', () => {
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

# Update converter.ts to be a facade for the specific converters
echo "📝 Updating converter class..."
cat > src/converters/converter.ts << 'EOF'
import { CypressToPlaywrightConverter } from './cypress/to-playwright';
import { PlaywrightToTestRailConverter } from './playwright/to-testrail';

export class TestConverter {
    convertToPlaywright(source: string): string {
        const converter = new CypressToPlaywrightConverter(source);
        const result = converter.convertToTargetFramework();
        return result.convertedCode;
    }

    convertToTestRail(source: string): string {
        const converter = new PlaywrightToTestRailConverter(source);
        const result = converter.convertToTargetFramework();
        return result.convertedCode;
    }
}
EOF

# Create index.ts to export all converters
echo "📝 Creating index file for converters..."
cat > src/converters/index.ts << 'EOF'
export * from './converter';
export * from './cypress/to-playwright';
export * from './playwright/to-testrail';
export * from './testrail/to-cypress';
export * from './testrail/to-playwright';
EOF

# Update package.json scripts
echo "📝 Updating package.json scripts..."
npx json -I -f package.json -e '
    this.scripts = {
        ...this.scripts,
        "test:converters": "mocha --config .mocharc.json \"src/test/suite/converters.test.ts\"",
        "test:watch:converters": "mocha --config .mocharc.json \"src/test/suite/converters.test.ts\" --watch --watch-files src/converters/**/*.ts,src/test/suite/converters.test.ts"
    }
'

# Clean and rebuild
echo "🧹 Cleaning and rebuilding..."
rm -rf out/
npm run compile

echo "✅ Update complete! You can now run the converter tests with:"
echo "npm run test:converters"
echo ""
echo "To watch for changes during development:"
echo "npm run test:watch:converters"
echo ""
echo "Backups of modified files are stored in: $backup_dir"