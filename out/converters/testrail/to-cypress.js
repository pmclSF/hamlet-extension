"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRailToPlaywrightConverter = exports.TestRailToCypressConverter = void 0;
const base_converter_1 = require("../base-converter");
const testrail_patterns_1 = require("../../test-patterns/testrail-patterns");
class TestRailToCypressConverter extends base_converter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.stepToCypressCommand = {
            'Navigate to': 'cy.visit',
            'Click': 'cy.click',
            'Enter text': 'cy.type',
            'Verify': 'cy.should',
            'Check': 'cy.check',
            'Select': 'cy.select'
        };
    }
    parseTestCases() {
        const testCases = [];
        let match;
        while ((match = testrail_patterns_1.testrailPatterns.testDefinition.exec(this.sourceCode)) !== null) {
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
    convertToTargetFramework() {
        try {
            let convertedCode = '';
            convertedCode += `/// <reference types="cypress" />\n\n`;
            const suites = this.parseSuites();
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
        let result = `describe('${suite.title}', () => {\n`;
        // Convert TestRail steps to Cypress commands
        for (const test of suite.tests) {
            result += this.convertTestCase(test);
        }
        result += '});\n\n';
        return result;
    }
    convertTestCase(testCase) {
        const steps = this.extractSteps(testCase.body);
        let cypressCommands = steps.map(step => this.convertStepToCypressCommand(step));
        return `  it('${testCase.title}', () => {\n    ${cypressCommands.join('\n    ')}\n  });\n\n`;
    }
    extractSteps(testBody) {
        const steps = [];
        let match;
        while ((match = testrail_patterns_1.testrailPatterns.step.exec(testBody)) !== null) {
            steps.push(match[2]);
        }
        return steps;
    }
    convertStepToCypressCommand(step) {
        for (const [keyword, command] of Object.entries(this.stepToCypressCommand)) {
            if (step.startsWith(keyword)) {
                const param = step.slice(keyword.length).trim();
                return `${command}('${param}');`;
            }
        }
        return `// TODO: Convert step: ${step}`;
    }
    generateWarnings() {
        return ['Some TestRail steps may require manual adjustment for Cypress syntax'];
    }
}
exports.TestRailToCypressConverter = TestRailToCypressConverter;
class TestRailToPlaywrightConverter extends base_converter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.stepToPlaywrightCommand = {
            'Navigate to': 'await page.goto',
            'Click': 'await page.click',
            'Enter text': 'await page.fill',
            'Verify': 'await expect',
            'Check': 'await page.check',
            'Select': 'await page.selectOption'
        };
    }
    parseTestCases() {
        const testCases = [];
        let match;
        while ((match = testrail_patterns_1.testrailPatterns.testDefinition.exec(this.sourceCode)) !== null) {
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
    convertToTargetFramework() {
        try {
            let convertedCode = '';
            convertedCode += `import { test, expect } from '@playwright/test';\n\n`;
            const suites = this.parseSuites();
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
        for (const test of suite.tests) {
            result += this.convertTestCase(test);
        }
        result += '});\n\n';
        return result;
    }
    convertTestCase(testCase) {
        const steps = this.extractSteps(testCase.body);
        let playwrightCommands = steps.map(step => this.convertStepToPlaywrightCommand(step));
        return `  test('${testCase.title}', async ({ page }) => {\n    ${playwrightCommands.join('\n    ')}\n  });\n\n`;
    }
    extractSteps(testBody) {
        const steps = [];
        let match;
        while ((match = testrail_patterns_1.testrailPatterns.step.exec(testBody)) !== null) {
            steps.push(match[2]);
        }
        return steps;
    }
    convertStepToPlaywrightCommand(step) {
        for (const [keyword, command] of Object.entries(this.stepToPlaywrightCommand)) {
            if (step.startsWith(keyword)) {
                const param = step.slice(keyword.length).trim();
                if (command.includes('expect')) {
                    return `${command}(page.locator('${param}')).toBeVisible();`;
                }
                return `${command}('${param}');`;
            }
        }
        return `// TODO: Convert step: ${step}`;
    }
    generateWarnings() {
        return [
            'Some TestRail steps may require manual adjustment for Playwright syntax',
            'Consider adding explicit waitFor statements for better reliability'
        ];
    }
}
exports.TestRailToPlaywrightConverter = TestRailToPlaywrightConverter;
//# sourceMappingURL=to-cypress.js.map