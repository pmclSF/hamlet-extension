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
            // First convert the content, then handle imports
            let convertedCode = this.sourceCode;
    
            // Store all matches before replacing
            const testMatches: Array<{
                title: string;
                body: string;
                full: string;
            }> = [];
    
            // Find all test blocks first
            const testRegex = /test\s*\(\s*(['"`])(.*?)\1\s*,\s*async\s*\(\{\s*page\s*\}\)\s*=>\s*{([\s\S]*?)}\)/g;
            let match;
            while ((match = testRegex.exec(this.sourceCode)) !== null) {
                testMatches.push({
                    title: match[2],
                    body: match[3],
                    full: match[0]
                });
            }
    
            // Convert each test block
            testMatches.forEach(({ title, body, full }) => {
                const convertedBody = this.convertTestBody(body);
                const converted = `it('${title}', () => {${convertedBody}})`;
                convertedCode = convertedCode.replace(full, converted);
            });
    
            // Convert test.describe to describe
            convertedCode = convertedCode.replace(
                /test\.describe\s*\(\s*(['"`])(.*?)\1\s*,\s*(?:\(\s*\)\s*=>\s*)?{/g,
                'describe($1$2$1, () => {'
            );
    
            // Remove Playwright imports
            convertedCode = convertedCode.replace(
                /import\s*{[^}]*}\s*from\s*['"]@playwright\/test['"];?\s*/g,
                ''
            );
    
            // Add Cypress types reference
            if (!convertedCode.includes('/// <reference')) {
                convertedCode = `/// <reference types="cypress" />\n\n${convertedCode}`;
            }
    
            // Format the code
            convertedCode = this.formatCode(convertedCode);
    
            // Validate conversion
            if (!convertedCode.includes('describe(') || !convertedCode.includes('it(')) {
                console.warn('Conversion validation failed:', {
                    hasDescribe: convertedCode.includes('describe('),
                    hasIt: convertedCode.includes('it('),
                    converted: convertedCode
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
    
        // Convert page actions
        const conversions: Array<{ from: RegExp; to: string }> = [
            {
                from: /await\s+page\.goto\(['"]([^'"]+)['"]\)/g,
                to: "cy.visit('$1')"
            },
            {
                from: /await\s+page\.click\(['"]([^'"]+)['"]\)/g,
                to: "cy.get('$1').click()"
            },
            {
                from: /await\s+page\.locator\(['"]([^'"]+)['"]\)\.click\(\)/g,
                to: "cy.get('$1').click()"
            },
            {
                from: /await\s+page\.fill\(['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\)/g,
                to: "cy.get('$1').type('$2')"
            }
        ];
    
        // Apply conversions
        conversions.forEach(({ from, to }) => {
            convertedBody = convertedBody.replace(from, to);
        });
    
        // Remove any remaining awaits
        convertedBody = convertedBody.replace(/await\s+/g, '');
    
        // Add indentation
        return `\n${this.indentLines(convertedBody)}\n`;
    }
    
    private formatCode(code: string): string {
        return code
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
            .replace(/\n{3,}/g, '\n\n') // Remove extra blank lines
            .trim() + '\n';
    }
    
    private indentLines(text: string): string {
        return text
            .split('\n')
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