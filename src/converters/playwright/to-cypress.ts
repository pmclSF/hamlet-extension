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
            // First, normalize line endings and remove extra whitespace
            let convertedCode = this.sourceCode.replace(/\r\n/g, '\n').trim();
    
            // Create an array to store the converted lines
            const lines: string[] = [];
            
            // Add Cypress types reference
            lines.push('/// <reference types="cypress" />');
            lines.push('');
    
            // Split into blocks
            const blocks = convertedCode.split(/test\.describe/);
            
            // Process each block
            for (let i = 1; i < blocks.length; i++) { // Start from 1 to skip initial content
                const block = blocks[i];
                
                // Extract describe block details
                const describeMatch = block.match(/\(\s*['"`](.*?)['"`]\s*,\s*(?:\(\s*\)\s*=>\s*)?{([\s\S]*)/);
                
                if (describeMatch) {
                    const [_, title, content] = describeMatch;
                    
                    // Start describe block
                    lines.push(`describe('${title}', () => {`);
                    
                    // Convert test blocks
                    const testBlocks = content.match(/test\(\s*['"`](.*?)['"`]\s*,\s*async\s*\(\{\s*page\s*\}\)\s*=>\s*{([\s\S]*?)\}\s*\)/g) || [];
                    
                    testBlocks.forEach(testBlock => {
                        const testMatch = testBlock.match(/test\(\s*['"`](.*?)['"`]\s*,\s*async\s*\(\{\s*page\s*\}\)\s*=>\s*{([\s\S]*?)\}\s*\)/);
                        if (testMatch) {
                            const [__, testTitle, testBody] = testMatch;
                            const convertedBody = this.convertTestBody(testBody);
                            lines.push(`  it('${testTitle}', () => {`);
                            lines.push(convertedBody);
                            lines.push('  });');
                        }
                    });
                    
                    // Close describe block
                    lines.push('});');
                    lines.push('');
                }
            }
    
            // Join all lines
            convertedCode = lines.join('\n');
    
            // Validate conversion
            const hasDescribe = convertedCode.includes('describe(');
            const hasIt = convertedCode.includes('it(');
    
            if (!hasDescribe || !hasIt) {
                console.warn('Conversion validation failed:', {
                    input: this.sourceCode,
                    output: convertedCode,
                    hasDescribe,
                    hasIt
                });
                throw new Error('Failed to convert test structure');
            }
    
            return {
                success: true,
                convertedCode,
                warnings: this.generateWarnings()
            };
        } catch (error: unknown) {
            console.error('Conversion error:', error);
            return this.handleError(error);
        }
    }
    
    private convertTestBody(body: string): string {
        let convertedBody = body.trim();
    
        // Convert Playwright commands to Cypress commands
        const conversions = [
            {
                from: /await\s+page\.goto\(['"]([^'"]+)['"]\)/g,
                to: "    cy.visit('$1');"
            },
            {
                from: /await\s+page\.click\(['"]([^'"]+)['"]\)/g,
                to: "    cy.get('$1').click();"
            },
            {
                from: /await\s+page\.locator\(['"]([^'"]+)['"]\)\.click\(\)/g,
                to: "    cy.get('$1').click();"
            },
            {
                from: /await\s+page\.type\(['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\)/g,
                to: "    cy.get('$1').type('$2');"
            }
        ];
    
        // Apply each conversion
        conversions.forEach(({ from, to }) => {
            convertedBody = convertedBody.replace(from, to);
        });
    
        // Remove leftover awaits and blank lines
        convertedBody = convertedBody
            .replace(/await\s+/g, '')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
    
        return convertedBody;
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

        return code.slice(0, index - 1);
    }

    private extractAssertions(testBody: string): string[] {
        const assertions: string[] = [];
        const assertionPattern = /expect\((.*?)\)\.(.*?)\(/g;
        let match;

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

    private convertAssertion(playwrightAssertion: string): string {
        const assertionMap: { [key: string]: string } = {
            'toBeVisible': 'be.visible',
            'toBeHidden': 'be.hidden',
            'toHaveText': 'have.text',
            'toHaveValue': 'have.value',
            'toBeChecked': 'be.checked',
            'toBeDisabled': 'be.disabled',
            'toBeEnabled': 'be.enabled'
        };
        
        return assertionMap[playwrightAssertion] || playwrightAssertion;
    }

    private generateWarnings(): string[] {
        const warningPatterns = [
            {
                pattern: 'route.fulfill',
                message: 'Network interception needs manual conversion to cy.intercept()'
            },
            {
                pattern: 'waitForLoadState',
                message: 'waitForLoadState needs conversion to appropriate Cypress wait command'
            },
            {
                pattern: 'page.evaluate',
                message: 'page.evaluate needs conversion to cy.window() or cy.invoke()'
            }
        ];
    
        return warningPatterns
            .filter(({ pattern }) => this.sourceCode.includes(pattern))
            .map(({ message }) => message);
    }
}