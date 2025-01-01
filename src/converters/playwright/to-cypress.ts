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
            let convertedCode = this.sourceCode;
    
            // First, remove Playwright imports
            convertedCode = convertedCode.replace(
                /import\s*{[^}]*}\s*from\s*['"]@playwright\/test['"];?\s*/g,
                ''
            );
    
            // Convert test.describe blocks first
            convertedCode = convertedCode.replace(
                /test\.describe\s*\(\s*(['"])(.*?)\1\s*,\s*\(\s*\)\s*=>\s*{([\s\S]*?)}\s*\)\s*;?\s*$/gm,
                (_, quote, title, content) => {
                    return `describe(${quote}${title}${quote}, () => {${content}});`;
                }
            );
    
            // Then convert individual test blocks
            convertedCode = convertedCode.replace(
                /test\s*\(\s*(['"])(.*?)\1\s*,\s*async\s*\(\{\s*page\s*\}\)\s*=>\s*{([\s\S]*?)}\s*\)\s*;?\s*$/gm,
                (_, quote, title, body) => {
                    const convertedBody = this.convertTestBody(body);
                    return `it(${quote}${title}${quote}, () => {${convertedBody}});`;
                }
            );
    
            // Add Cypress types reference
            if (!convertedCode.includes('/// <reference')) {
                convertedCode = `/// <reference types="cypress" />\n\n${convertedCode}`;
            }
    
            // Clean up whitespace and formatting
            convertedCode = convertedCode
                .replace(/\n\s*\n\s*\n/g, '\n\n')  // Remove extra blank lines
                .replace(/[;\s]+$/, '')             // Remove trailing semicolons and spaces
                .trim() + '\n';                     // Ensure single trailing newline
    
            return {
                success: true,
                convertedCode,
                warnings: this.generateWarnings()
            };
        } catch (error: unknown) {
            return this.handleError(error);
        }
    }
    
    private convertTestBody(body: string): string {
        let convertedBody = body.trim();
    
        // Convert Playwright commands to Cypress commands
        const conversions = [
            // Convert chained locator commands
            {
                from: /await\s+page\.locator\(['"]([^'"]+)['"]\)\.(\w+)\(\)/g,
                to: (match: string, selector: string, action: string) => 
                    `cy.get('${selector}').${action}()`
            },
            // Convert page.goto
            {
                from: /await\s+page\.goto\(['"]([^'"]+)['"]\)/g,
                to: (match: string, url: string) => 
                    `cy.visit('${url}')`
            },
            // Convert page.click
            {
                from: /await\s+page\.click\(['"]([^'"]+)['"]\)/g,
                to: (match: string, selector: string) => 
                    `cy.get('${selector}').click()`
            },
            // Convert other page actions
            {
                from: /await\s+page\.(\w+)\(['"]([^'"]+)['"]\)/g,
                to: (match: string, action: string, selector: string) => {
                    const cypressCmd = this.actionMappings[action] || action;
                    return `cy.${cypressCmd}('${selector}')`;
                }
            },
            // Convert expectations
            {
                from: /expect\((.*?)\)\.(\w+)\((.*?)\)/g,
                to: (match: string, target: string, assertion: string, args: string) => {
                    const cypressAssertion = this.convertAssertion(assertion);
                    return `cy.get(${target}).should('${cypressAssertion}'${args ? `, ${args}` : ''})`;
                }
            },
            // Remove remaining awaits
            {
                from: /await\s+/g,
                to: ''
            }
        ];
    
        // Apply all conversions
        conversions.forEach(({ from, to }) => {
            convertedBody = convertedBody.replace(from, to as any);
        });
    
        // Properly indent the converted body
        return convertedBody.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => `    ${line}`)
            .join('\n');
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
        const potentialIssues = [
            {
                pattern: 'route.fulfill',
                message: 'Playwright route.fulfill() needs manual conversion to cy.intercept()'
            },
            {
                pattern: 'waitForLoadState',
                message: 'Consider replacing waitForLoadState with appropriate Cypress commands'
            },
            {
                pattern: 'context.',
                message: 'Browser context management needs manual conversion for Cypress'
            },
            {
                pattern: 'expect(',
                message: 'Some assertions might need manual adjustment for Cypress syntax'
            }
        ];

        return potentialIssues
            .filter(issue => this.sourceCode.includes(issue.pattern))
            .map(issue => issue.message);
    }
}