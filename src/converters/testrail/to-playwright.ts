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
            const testBody = this.extractBody(this.sourceCode.slice(startIndex));
            
            testCases.push({
                title,
                body: testBody,
                assertions: this.extractStepAssertions(testBody)
            });
        }

        return testCases;
    }

    parseSuites(): TestSuite[] {
        const suites: TestSuite[] = [];
        let match;

        while ((match = testrailPatterns.suiteDefinition.exec(this.sourceCode)) !== null) {
            const title = match[2];
            const startIndex = match.index + match[0].length;
            const suiteBody = this.extractBody(this.sourceCode.slice(startIndex));
            
            suites.push({
                title,
                tests: this.parseTestCases(),
                beforeAll: this.extractHooks(suiteBody, testrailPatterns.beforeAll),
                afterAll: this.extractHooks(suiteBody, testrailPatterns.afterAll),
                beforeEach: this.extractHooks(suiteBody, testrailPatterns.beforeEach),
                afterEach: this.extractHooks(suiteBody, testrailPatterns.afterEach)
            });
        }

        return suites;
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
                warnings: this.generateWarnings(),
                errors: [] // Add empty errors array
            };
        } catch (error) {
            return this.handleError(error);
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

    private extractSteps(testBody: string): string[] {
        const steps: string[] = [];
        let match;

        while ((match = testrailPatterns.step.exec(testBody)) !== null) {
            steps.push(match[2]);
        }

        return steps;
    }

    private extractStepAssertions(testBody: string): string[] {
        const assertions: string[] = [];
        let match;

        while ((match = testrailPatterns.assertion.exec(testBody)) !== null) {
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