import { BaseConverter } from '../base-converter';
import { TestCase, TestSuite, ConversionResult } from '../../types';
import { testrailPatterns } from '../../test-patterns/testrail-patterns';

export class TestRailToCypressConverter extends BaseConverter {
    private readonly stepToCypressCommand = {
        'Navigate to': 'cy.visit',
        'Click': 'cy.click',
        'Enter text': 'cy.type',
        'Verify': 'cy.should',
        'Check': 'cy.check',
        'Select': 'cy.select'
    };

    parseTestCases(): TestCase[] {
        const testCases: TestCase[] = [];
        let match;

        while ((match = testrailPatterns.testDefinition.exec(this.sourceCode)) !== null) {
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

    convertToTargetFramework(): ConversionResult {
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
        } catch (error) {
            return {
                success: false,
                convertedCode: '',
                errors: [error.message]
            };
        }
    }

    private convertSuite(suite: TestSuite): string {
        let result = `describe('${suite.title}', () => {\n`;

        // Convert TestRail steps to Cypress commands
        for (const test of suite.tests) {
            result += this.convertTestCase(test);
        }

        result += '});\n\n';
        return result;
    }

    private convertTestCase(testCase: TestCase): string {
        const steps = this.extractSteps(testCase.body);
        let cypressCommands = steps.map(step => this.convertStepToCypressCommand(step));

        return `  it('${testCase.title}', () => {\n    ${cypressCommands.join('\n    ')}\n  });\n\n`;
    }

    private extractSteps(testBody: string): string[] {
        const steps: string[] = [];
        let match;

        while ((match = testrailPatterns.step.exec(testBody)) !== null) {
            steps.push(match[2]);
        }

        return steps;
    }

    private convertStepToCypressCommand(step: string): string {
        for (const [keyword, command] of Object.entries(this.stepToCypressCommand)) {
            if (step.startsWith(keyword)) {
                const param = step.slice(keyword.length).trim();
                return `${command}('${param}');`;
            }
        }
        return `// TODO: Convert step: ${step}`;
    }

    private generateWarnings(): string[] {
        return ['Some TestRail steps may require manual adjustment for Cypress syntax'];
    }
}

// src/converters/testrail/to-playwright.ts
import { BaseConverter } from '../base-converter';
import { TestCase, TestSuite, ConversionResult } from '../../types';
import { testrailPatterns } from '../../test-patterns/testrail-patterns';

export class TestRailToPlaywrightConverter extends BaseConverter {
    private readonly stepToPlaywrightCommand = {
        'Navigate to': 'await page.goto',
        'Click': 'await page.click',
        'Enter text': 'await page.fill',
        'Verify': 'await expect',
        'Check': 'await page.check',
        'Select': 'await page.selectOption'
    };

    parseTestCases(): TestCase[] {
        const testCases: TestCase[] = [];
        let match;

        while ((match = testrailPatterns.testDefinition.exec(this.sourceCode)) !== null) {
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

    convertToTargetFramework(): ConversionResult {
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
        } catch (error) {
            return {
                success: false,
                convertedCode: '',
                errors: [error.message]
            };
        }
    }

    private convertSuite(suite: TestSuite): string {
        let result = `test.describe('${suite.title}', () => {\n`;

        for (const test of suite.tests) {
            result += this.convertTestCase(test);
        }

        result += '});\n\n';
        return result;
    }

    private convertTestCase(testCase: TestCase): string {
        const steps = this.extractSteps(testCase.body);
        let playwrightCommands = steps.map(step => this.convertStepToPlaywrightCommand(step));

        return `  test('${testCase.title}', async ({ page }) => {\n    ${playwrightCommands.join('\n    ')}\n  });\n\n`;
    }

    private extractSteps(testBody: string): string[] {
        const steps: string[] = [];
        let match;

        while ((match = testrailPatterns.step.exec(testBody)) !== null) {
            steps.push(match[2]);
        }

        return steps;
    }

    private convertStepToPlaywrightCommand(step: string): string {
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

    private generateWarnings(): string[] {
        return [
            'Some TestRail steps may require manual adjustment for Playwright syntax',
            'Consider adding explicit waitFor statements for better reliability'
        ];
    }
}