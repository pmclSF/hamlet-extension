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
        'select': 'selectOption'
    };

    parseTestCases(): TestCase[] {
        const testCases: TestCase[] = [];
        let match;

        while ((match = cypressPatterns.testDefinition.exec(this.sourceCode)) !== null) {
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

        while ((match = cypressPatterns.suiteDefinition.exec(this.sourceCode)) !== null) {
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
            // Early return for non-test code
            if (!this.sourceCode.includes('describe(') && !this.sourceCode.includes('it(')) {
                return {
                    success: true,
                    convertedCode: this.sourceCode,
                    warnings: []
                };
            }

            const suites = this.parseSuites();
            let convertedCode = '';

            // Add Playwright imports only if we're converting test code
            convertedCode += "import { test, expect } from '@playwright/test';\n\n";

            for (const suite of suites) {
                convertedCode += this.convertSuite(suite);
            }

            return {
                success: true,
                convertedCode,
                warnings: this.generateWarnings()
            };
        } catch (error: unknown) {
            return this.handleError(error);
        }
    }

    private extractBody(code: string): string {
        let braceCount = 1;
        let index = 0;
        
        while (braceCount > 0 && index < code.length) {
            if (code[index] === '{') braceCount++;
            if (code[index] === '}') braceCount--;
            index++;
        }

        return code.slice(0, index - 1);
    }

    private extractAssertions(testBody: string): string[] {
        const assertions: string[] = [];
        let match;

        while ((match = cypressPatterns.assertion.exec(testBody)) !== null) {
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

        result += '});\n\n';
        return result;
    }

    private convertTestCase(testCase: TestCase): string {
        let convertedBody = testCase.body;

        // Convert Cypress commands to Playwright
        Object.entries(this.commandMappings).forEach(([cypressCmd, playwrightCmd]) => {
            convertedBody = convertedBody.replace(
                new RegExp(`cy.${cypressCmd}\\(`, 'g'),
                `page.${playwrightCmd}(`
            );
        });

        return `  test('${testCase.title}', async ({ page }) => {\n${convertedBody}  });\n\n`;
    }

    private convertHooks(hookType: string, hooks: string[]): string {
        return hooks.map(hook => 
            `  test.${hookType}(async ({ page }) => {\n${hook}  });\n\n`
        ).join('');
    }

    private generateWarnings(): string[] {
        const warnings: string[] = [];
        
        if (this.sourceCode.includes('cy.intercept(')) {
            warnings.push('Cypress intercept commands need manual conversion to Playwright route.fulfill()');
        }
        if (this.sourceCode.includes('cy.wait(')) {
            warnings.push('Consider replacing cy.wait() with more specific Playwright waitFor conditions');
        }

        return warnings;
    }
}