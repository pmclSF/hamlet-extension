import { BaseConverter } from '../base-converter';
import { TestCase, TestSuite, ConversionResult } from '../../types';
import { cypressPatterns } from '../../test-patterns/cypress-patterns';

export class CypressToPlaywrightConverter extends BaseConverter {
    private readonly commandMappings: { [key: string]: string } = {
        'visit': 'goto',
        'get': 'locator',
        'contains': 'getByText',
        'find': 'locator',
        'click': 'click',
        'type': 'fill',
        'check': 'check',
        'uncheck': 'uncheck',
        'select': 'selectOption',
        'should': 'toBeVisible' // Add mapping for should -> expect assertions
    };

    private readonly assertionMappings: { [key: string]: string } = {
        'be.visible': 'toBeVisible',
        'be.hidden': 'toBeHidden',
        'exist': 'toBeAttached',
        'have.text': 'toHaveText',
        'have.value': 'toHaveValue',
        'be.checked': 'toBeChecked',
        'be.disabled': 'toBeDisabled',
        'be.enabled': 'toBeEnabled'
    };

    parseTestCases(): TestCase[] {
        const testCases: TestCase[] = [];
        let match;
        const testPattern = new RegExp(cypressPatterns.testDefinition, 'g');

        while ((match = testPattern.exec(this.sourceCode)) !== null) {
            const title = match[2];
            const startIndex = match.index + match[0].length;
            const testBody = this.extractBody(this.sourceCode.slice(startIndex));
            
            testCases.push({
                title,
                body: testBody,
                assertions: this.extractAssertions(testBody)
            });
        }

        return testCases;
    }

    parseSuites(): TestSuite[] {
        const suites: TestSuite[] = [];
        let match;
        const suitePattern = new RegExp(cypressPatterns.suiteDefinition, 'g');

        while ((match = suitePattern.exec(this.sourceCode)) !== null) {
            const title = match[2];
            const startIndex = match.index + match[0].length;
            const suiteBody = this.extractBody(this.sourceCode.slice(startIndex));
            
            suites.push({
                title,
                tests: this.parseTestCases(),
                beforeAll: this.extractHooks(suiteBody, cypressPatterns.beforeAll),
                afterAll: this.extractHooks(suiteBody, cypressPatterns.afterAll),
                beforeEach: this.extractHooks(suiteBody, cypressPatterns.beforeEach),
                afterEach: this.extractHooks(suiteBody, cypressPatterns.afterEach)
            });
        }

        return suites;
    }

    convertToTargetFramework(): ConversionResult {
        try {
            let convertedCode = this.sourceCode;
            const warnings: string[] = [];

            // Handle simple file with no test structure
            if (!this.sourceCode.includes('describe(') && !this.sourceCode.includes('it(')) {
                convertedCode = this.convertCypressCommands(convertedCode);
                return {
                    success: true,
                    convertedCode,
                    warnings: this.generateWarnings()
                };
            }

            // Convert test structure
            convertedCode = "import { test, expect } from '@playwright/test';\n\n";
            convertedCode += this.convertTestStructure();

            return {
                success: true,
                convertedCode,
                warnings: this.generateWarnings()
            };
        } catch (error: unknown) {
            return this.handleError(error);
        }
    }

    private convertTestStructure(): string {
        const suites = this.parseSuites();
        return suites.map(suite => this.convertSuite(suite)).join('\n');
    }

    private convertCypressCommands(code: string): string {
        // Convert Cypress commands to Playwright
        Object.entries(this.commandMappings).forEach(([cypressCmd, playwrightCmd]) => {
            code = code.replace(
                new RegExp(`cy\\.${cypressCmd}\\(`, 'g'),
                `await page.${playwrightCmd}(`
            );
        });

        // Convert assertions
        Object.entries(this.assertionMappings).forEach(([cypressAssertion, playwrightAssertion]) => {
            code = code.replace(
                new RegExp(`should\\(['"]${cypressAssertion}['"]\\)`, 'g'),
                `expect().${playwrightAssertion}()`
            );
        });

        return code;
    }

    private extractBody(code: string): string {
        let braceCount = 1;
        let index = 0;
        
        while (braceCount > 0 && index < code.length) {
            if (code[index] === '{') braceCount++;
            if (code[index] === '}') braceCount--;
            index++;
        }

        return code.slice(0, index - 1).trim();
    }

    private extractAssertions(testBody: string): string[] {
        const assertions: string[] = [];
        let match;
        const assertionPattern = new RegExp(cypressPatterns.assertion, 'g');

        while ((match = assertionPattern.exec(testBody)) !== null) {
            assertions.push(match[1]);
        }

        return assertions;
    }

    private extractHooks(code: string, pattern: RegExp): string[] {
        const hooks: string[] = [];
        let match;

        while ((match = pattern.exec(code)) !== null) {
            const hookBody = this.extractBody(code.slice(match.index + match[0].length));
            hooks.push(hookBody);
        }

        return hooks;
    }

    private convertSuite(suite: TestSuite): string {
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

        result += '});\n';
        return result;
    }

    private convertTestCase(testCase: TestCase): string {
        let convertedBody = this.convertCypressCommands(testCase.body);
        return `  test('${testCase.title}', async ({ page }) => {\n    ${convertedBody}\n  });\n\n`;
    }

    private convertHooks(hookType: string, hooks: string[]): string {
        return hooks.map(hook => {
            const convertedHookBody = this.convertCypressCommands(hook);
            return `  test.${hookType}(async ({ page }) => {\n    ${convertedHookBody}\n  });\n\n`;
        }).join('');
    }

    private generateWarnings(): string[] {
        const warnings: string[] = [];
        
        if (this.sourceCode.includes('cy.intercept(')) {
            warnings.push('Cypress intercept commands need manual conversion to Playwright route.fulfill()');
        }
        if (this.sourceCode.includes('cy.wait(')) {
            warnings.push('Consider replacing cy.wait() with more specific Playwright waitFor conditions');
        }
        if (this.sourceCode.includes('should(')) {
            warnings.push('Some Cypress assertions might need manual adjustment');
        }

        return warnings;
    }
}