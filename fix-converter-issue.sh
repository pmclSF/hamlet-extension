#!/bin/bash

echo "🔧 Fixing converter implementation issues..."

# Create backup directory
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="converter_fixes_$timestamp"
mkdir -p "$backup_dir"

# Backup files before modification
echo "📦 Creating backups in $backup_dir..."
cp src/converters/cypress/to-playwright.ts "$backup_dir/"
cp src/converters/playwright/to-testrail.ts "$backup_dir/"

# Add early return check in CypressToPlaywrightConverter
echo "📝 Updating CypressToPlaywrightConverter..."
awk '
/convertToTargetFramework\(\): ConversionResult {/ {
    print $0
    print "        try {"
    print "            // Check if there'\''s actual test code first"
    print "            if (!this.sourceCode.includes('\''describe('\'') && !this.sourceCode.includes('\''it('\'')) {"
    print "                return {"
    print "                    success: true,"
    print "                    convertedCode: this.sourceCode,"
    print "                    warnings: []"
    print "                };"
    print "            }"
    print ""
    next
}
{ print $0 }' src/converters/cypress/to-playwright.ts > temp.ts && mv temp.ts src/converters/cypress/to-playwright.ts

# Fix test_case to testCase in PlaywrightToTestRailConverter
echo "📝 Updating PlaywrightToTestRailConverter..."
sed -i '' 's/test_case/testCase/g' src/converters/playwright/to-testrail.ts

# Clean and rebuild
echo "🧹 Cleaning and rebuilding..."
rm -rf out/
npm run compile

echo "✅ Fixes complete! Running tests to verify..."
npx mocha --config .mocharc.json "src/test/suite/**/*.test.ts" --grep "Test Converter"

echo "Backups of modified files are stored in: $backup_dir"