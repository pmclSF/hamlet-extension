import { BaseConverter } from '../base-converter';
import { TestCase, TestSuite, ConversionResult } from '../../types';

export class PlaywrightToCypressConverter extends BaseConverter {
    private readonly actionMappings: { [key: string]: string } = {
        'goto': 'visit',
        'locator': 'get',
        'getByText': 'contains',
        'click': 'click',
        'fill': 'type',
        'check': 'check',
        'uncheck': 'uncheck',
        'selectOption': 'select'
    };

    convertToTargetFramework(): ConversionResult {
        try {
            const lines: string[] = [];
            
            // Add Cypress reference
            lines.push('/// <reference types="cypress" />');
            lines.push('');

            // Parse the source code
            const sourceLines = this.sourceCode.split('\n');
            let inDescribeBlock = false;
            let currentIndentation = '';

            for (let i = 0; i < sourceLines.length; i++) {
                const line = sourceLines[i].trim();

                // Skip import statements
                if (line.startsWith('import')) {
                    continue;
                }

                // Convert describe block
                if (line.includes('test.describe')) {
                    const match = line.match(/test\.describe\s*\(\s*['"`](.*?)['"`]/);
                    if (match) {
                        inDescribeBlock = true;
                        lines.push(`describe('${match[1]}', () => {`);
                        continue;
                    }
                }

                // Convert test block
                if (line.includes('test(')) {
                    const match = line.match(/test\s*\(\s*['"`](.*?)['"`]/);
                    if (match) {
                        lines.push(`  it('${match[1]}', () => {`);
                        continue;
                    }
                }

                // Convert page commands
                if (line.includes('page.')) {
                    const convertedLine = this.convertPageCommand(line);
                    if (convertedLine) {
                        lines.push(`    ${convertedLine}`);
                        continue;
                    }
                }

                // Handle closing braces
                if (line === '});') {
                    if (inDescribeBlock) {
                        lines.push('});');
                        inDescribeBlock = false;
                    } else {
                        lines.push('  });');
                    }
                    continue;
                }
            }

            return {
                success: true,
                convertedCode: lines.join('\n'),
                warnings: this.generateWarnings(),
                errors: []
            };
        } catch (error) {
            console.error('Conversion error:', error);
            return this.handleError(error);
        }
    }

    private convertPageCommand(line: string): string | null {
        // Remove await and trim
        line = line.replace('await', '').trim();

        // Convert goto
        if (line.includes('page.goto')) {
            const match = line.match(/page\.goto\s*\(\s*['"`](.*?)['"`]\s*\)/);
            if (match) {
                return `cy.visit('${match[1]}');`;
            }
        }

        // Convert click
        if (line.includes('.click')) {
            const match = line.match(/page\.(?:locator|click)\s*\(\s*['"`](.*?)['"`]\s*\)(?:\.click\(\))?/);
            if (match) {
                return `cy.get('${match[1]}').click();`;
            }
        }

        // Convert type/fill
        if (line.includes('.fill') || line.includes('.type')) {
            const match = line.match(/page\.(?:fill|type)\s*\(\s*['"`](.*?)['"`]\s*,\s*['"`](.*?)['"`]\s*\)/);
            if (match) {
                return `cy.get('${match[1]}').type('${match[2]}');`;
            }
        }

        return null;
    }

    parseTestCases(): TestCase[] {
        const testCases: TestCase[] = [];
        const testPattern = /test\s*\(\s*(['"`])(.*?)\1\s*,\s*async\s*\(\s*{\s*page\s*}\s*\)\s*=>\s*{/g;
        let match;

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
        const suitePattern = /test\.describe\s*\(\s*(['"`])(.*?)\1\s*,\s*\(\s*\)\s*=>\s*{/g;
        let match;

        while ((match = suitePattern.exec(this.sourceCode)) !== null) {
            const title = match[2];
            const startIndex = match.index + match[0].length;
            const suiteBody = this.extractBody(this.sourceCode.slice(startIndex));
            
            suites.push({
                title,
                tests: this.parseTestCases(),
                beforeAll: this.extractHooks(suiteBody, /test\.beforeAll/g),
                afterAll: this.extractHooks(suiteBody, /test\.afterAll/g),
                beforeEach: this.extractHooks(suiteBody, /test\.beforeEach/g),
                afterEach: this.extractHooks(suiteBody, /test\.afterEach/g)
            });
        }

        return suites;
    }

    private extractBody(code: string): string {
        let braceCount = 1;
        let index = 0;
        
        while (braceCount > 0 && index < code.length) {
            if (code[index] === '{') braceCount++;
            if (code[index] === '}') braceCount--;
            index++;
        }

        return code.slice(0, Math.max(0, index - 1));
    }

    private extractAssertions(testBody: string): string[] {
        const assertions: string[] = [];
        const assertionPattern = /expect\((.*?)\)\.(.*?)\(/g;
        let match;

        while ((match = assertionPattern.exec(testBody)) !== null) {
            assertions.push(match[0]);
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

    private convertAssertion(assertion: string): string {
        // Convert Playwright assertions to Cypress
        const assertionMap: { [key: string]: string } = {
            'toBeVisible': 'be.visible',
            'toBeHidden': 'be.hidden',
            'toHaveText': 'have.text',
            'toHaveValue': 'have.value',
            'toBeChecked': 'be.checked',
            'toBeDisabled': 'be.disabled',
            'toBeEnabled': 'be.enabled'
        };

        for (const [playwright, cypress] of Object.entries(assertionMap)) {
            if (assertion.includes(playwright)) {
                return assertion.replace(playwright, cypress);
            }
        }

        return assertion;
    }

    private generateWarnings(): string[] {
        const warnings: string[] = [];
        
        if (this.sourceCode.includes('page.evaluate')) {
            warnings.push('page.evaluate needs to be converted to cy.window() or cy.invoke()');
        }
        
        if (this.sourceCode.includes('expect')) {
            warnings.push('Playwright assertions need to be converted to Cypress assertions');
        }

        return warnings;
    }
}