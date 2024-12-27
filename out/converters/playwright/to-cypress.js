"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CypressToPlaywrightConverter = void 0;
const base_converter_1 = require("../base-converter");
const cypress_patterns_1 = require("../../test-patterns/cypress-patterns");
class CypressToPlaywrightConverter extends base_converter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.commandMappings = {
            'visit': 'goto',
            'get': 'locator',
            'contains': 'getByText',
            'find': 'locator',
            'click': 'click',
            'type': 'fill',
            'should': 'toHaveText', // Default mapping, will need context
            'check': 'check',
            'uncheck': 'uncheck',
            'select': 'selectOption'
        };
        this.assertionMappings = {
            'be.visible': 'toBeVisible',
            'be.hidden': 'toBeHidden',
            'exist': 'toBeVisible',
            'have.text': 'toHaveText',
            'have.value': 'toHaveValue',
            'be.checked': 'toBeChecked',
            'be.disabled': 'toBeDisabled',
            'be.enabled': 'toBeEnabled'
        };
    }
    parseTestCases() {
        const testCases = [];
        let match;
        while ((match = cypress_patterns_1.cypressPatterns.testDefinition.exec(this.sourceCode)) !== null) {
            const title = match[2];
            const startIndex = match.index + match[0].length;
            const testBody = this.extractTestBody(this.sourceCode.slice(startIndex));
            testCases.push({
                title,
                body: testBody,
                assertions: this.extractAssertions(testBody)
            });
        }
        return testCases;
    }
    parseSuites() {
        const suites = [];
        let match;
        while ((match = cypress_patterns_1.cypressPatterns.suiteDefinition.exec(this.sourceCode)) !== null) {
            const title = match[2];
            const startIndex = match.index + match[0].length;
            const suiteBody = this.extractSuiteBody(this.sourceCode.slice(startIndex));
            suites.push({
                title,
                tests: this.parseTestCases(),
                beforeAll: this.extractHooks(suiteBody, cypress_patterns_1.cypressPatterns.beforeAll),
                afterAll: this.extractHooks(suiteBody, cypress_patterns_1.cypressPatterns.afterAll),
                beforeEach: this.extractHooks(suiteBody, cypress_patterns_1.cypressPatterns.beforeEach),
                afterEach: this.extractHooks(suiteBody, cypress_patterns_1.cypressPatterns.afterEach)
            });
        }
        return suites;
    }
    convertToTargetFramework() {
        try {
            const suites = this.parseSuites();
            let convertedCode = '';
            // Add Playwright imports
            convertedCode += "import { test, expect } from '@playwright/test';\n\n";
            for (const suite of suites) {
                convertedCode += this.convertSuite(suite);
            }
            return {
                success: true,
                convertedCode,
                warnings: this.generateWarnings()
            };
        }
        catch (error) {
            return {
                success: false,
                convertedCode: '',
                errors: [error.message]
            };
        }
    }
    convertSuite(suite) {
        let result = `test.describe('${suite.title}', () => {\n`;
        // Convert hooks
        if (suite.beforeAll?.length) {
            result += this.convertHooks('beforeAll', suite.beforeAll);
        }
        if (suite.afterAll?.length) {
            result += this.convertHooks('afterAll', suite.afterAll);
        }
        if (suite.beforeEach?.length) {
            result += this.convertHooks('beforeEach', suite.beforeEach);
        }
        if (suite.afterEach?.length) {
            result += this.convertHooks('afterEach', suite.afterEach);
        }
        // Convert test cases
        for (const testCase of suite.tests) {
            result += this.convertTestCase(testCase);
        }
        result += '});\n\n';
        return result;
    }
    convertTestCase(testCase) {
        let convertedBody = testCase.body;
        // Convert Cypress commands to Playwright
        Object.entries(this.commandMappings).forEach(([cypressCmd, playwrightCmd]) => {
            convertedBody = convertedBody.replace(new RegExp(`cy.${cypressCmd}\\(`, 'g'), `page.${playwrightCmd}(`);
        });
        // Convert assertions
        Object.entries(this.assertionMappings).forEach(([cypressAssert, playwrightAssert]) => {
            convertedBody = convertedBody.replace(new RegExp(`should\\(['"\`]${cypressAssert}['"\`]\\)`, 'g'), `${playwrightAssert}()`);
        });
        return `  test('${testCase.title}', async ({ page }) => {\n${convertedBody}  });\n\n`;
    }
    extractTestBody(code) {
        // Extract code between opening and closing braces
        let braceCount = 1;
        let index = 0;
        while (braceCount > 0 && index < code.length) {
            if (code[index] === '{')
                braceCount++;
            if (code[index] === '}')
                braceCount--;
            index++;
        }
        return code.slice(0, index - 1);
    }
    extractSuiteBody(code) {
        return this.extractTestBody(code);
    }
    extractHooks(code, pattern) {
        const hooks = [];
        let match;
        while ((match = pattern.exec(code)) !== null) {
            const hookBody = this.extractTestBody(code.slice(match.index + match[0].length));
            hooks.push(hookBody);
        }
        return hooks;
    }
    extractAssertions(code) {
        const assertions = [];
        let match;
        while ((match = cypress_patterns_1.cypressPatterns.assertion.exec(code)) !== null) {
            assertions.push(match[1]);
        }
        return assertions;
    }
    convertHooks(hookType, hooks) {
        return hooks.map(hook => `  test.${hookType}(async ({ page }) => {\n${hook}  });\n\n`).join('');
    }
    generateWarnings() {
        const warnings = [];
        // Check for unsupported Cypress features
        if (this.sourceCode.includes('cy.intercept(')) {
            warnings.push('Cypress intercept commands need manual conversion to Playwright route.fulfill()');
        }
        if (this.sourceCode.includes('cy.wait(')) {
            warnings.push('Consider replacing cy.wait() with more specific Playwright waitFor conditions');
        }
        return warnings;
    }
}
exports.CypressToPlaywrightConverter = CypressToPlaywrightConverter;
//# sourceMappingURL=to-cypress.js.map