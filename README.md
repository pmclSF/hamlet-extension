# Hamlet - Test Framework Converter

![Hamlet Logo](images/hamlet-logo.png)

## Overview
Hamlet is a VS Code extension that helps you convert tests between different testing frameworks. Whether you're migrating from Cypress to Playwright, or need to document your tests in TestRail, Hamlet makes the conversion process seamless.

> "To test, or not to test - that is no longer the question" 🎭

## Features

- **Framework Conversion**
  - Convert Cypress tests to Playwright
  - Convert Playwright tests to Cypress
  - Convert between testing frameworks and TestRail
  - Real-time syntax highlighting for test files

- **Smart Detection**
  - Automatically detects the source framework
  - Preserves test structure and assertions
  - Maintains hooks (before/after)
  - Handles async/await patterns

- **Customization**
  - Configurable indentation and quote styles
  - Custom keyboard shortcuts
  - Highlight color preferences
  - Framework-specific settings

## Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P`
3. Type `ext install hamlet`
4. Press Enter

## Usage

### Basic Conversion
1. Open a test file
2. Right-click and select "Convert to [Framework]" or use keyboard shortcuts:
   - To Playwright: `Ctrl/Cmd + Shift + T P`
   - To Cypress: `Ctrl/Cmd + Shift + T C`
   - To TestRail: `Ctrl/Cmd + Shift + T R`

### Settings
Access settings via:
1. Command Palette (`Ctrl/Cmd + Shift + P`)
2. Type "Hamlet: Show Settings"
3. Configure your preferences

## Examples

### Cypress to Playwright
```javascript
// Cypress
cy.visit('/login')
cy.get('[data-testid=username]').type('user')
cy.get('[data-testid=password]').type('pass')
cy.get('button').click()
cy.url().should('include', '/dashboard')

// Converted to Playwright
await page.goto('/login')
await page.fill('[data-testid=username]', 'user')
await page.fill('[data-testid=password]', 'pass')
await page.click('button')
await expect(page).toHaveURL(/dashboard/)
```

### Playwright to TestRail
```javascript
// Playwright
test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid=username]', 'user')
  await page.click('button')
  await expect(page).toHaveURL(/dashboard/)
})

// Converted to TestRail
test_case('C123 - User can login', () => {
  step('Navigate to login page', () => {
    // Navigate to /login
  })
  step('Enter username', () => {
    // Enter username in [data-testid=username]
  })
  step('Click login button', () => {
    // Click button
  })
  step('Verify redirect', () => {
    // Verify URL contains /dashboard
  })
})
```

## Development

### Prerequisites
- Node.js 14+
- VS Code

### Setup
```bash
git clone https://github.com/pmclsf/hamlet-extension.git
cd hamlet-extension
npm install
```

### Running Tests
```bash
npm test                 # Run all tests
npm run test:unit       # Run unit tests only
npm run test:e2e        # Run E2E tests
```

### Building
```bash
npm run compile     # Compile TypeScript
npm run watch      # Watch for changes
```

### Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Inspired by the testing community's need for framework flexibility
- Built with TypeScript and VS Code Extension API
- Special thanks to the Cypress, Playwright, and TestRail teams

## Support
- [Report Issues](https://github.com/pmclsf/hamlet-extension/issues)
- [Request Features](https://github.com/pmclsf/hamlet-extension/issues)
- [Documentation](https://github.com/pmclsf/hamlet-extension/wiki)