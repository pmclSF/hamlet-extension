import { BaseConverter } from '../base-converter';
import { TestCase, TestSuite, ConversionResult } from '../../types';
import { cypressPatterns } from '../../test-patterns/cypress-patterns';

export class CypressToTestRailConverter extends BaseConverter {
    private readonly commandToStep: { [key: string]: string } = {
        'visit': 'Navigate to',
        'click': 'Click',
        'type': 'Enter text',
        'check': 'Check',
        'uncheck': 'Uncheck',
        'select': 'Select',
        'should': 'Verify',
        'contains': 'Verify element contains'
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
            let convertedCode = '';
            convertedCode += `const { test_case, suite, step } = require('@testrail/api');\n\n`;

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

    private convertSuite(testSuite: TestSuite): string {
        let result = `suite('${testSuite.title}', () => {\n`;

        // Add setup steps from beforeAll/beforeEach if they exist
        const setupSteps = this.convertSetupSteps(testSuite);
        if (setupSteps) {
            result += setupSteps;
        }

        // Convert test cases
        for (const test of testSuite.tests) {
            result += this.convertTestCase(test);
        }

        // Add teardown steps from afterAll/afterEach if they exist
        const teardownSteps = this.convertTeardownSteps(testSuite);
        if (teardownSteps) {
            result += teardownSteps;
        }

        result += '});\n\n';
        return result;
    }

    private convertTestCase(testCase: TestCase): string {
        let result = `  test_case('${testCase.title}', () => {\n`;
        
        // Convert Cypress commands to TestRail steps
        const steps = this.extractCypressCommands(testCase.body);
        steps.forEach(step => {
            result += this.convertCommandToStep(step);
        });

        result += '  });\n\n';
        return result;
    }

    private extractCypressCommands(testBody: string): string[] {
        const commands: string[] = [];
        const commandPattern = /cy\.([\w]+)\((.*?)\)/g;
        let match;

        while ((match = commandPattern.exec(testBody)) !== null) {
            commands.push(`${match[1]}:${match[2]}`);
        }

        return commands;
    }

    private convertCommandToStep(command: string): string {
        const [cmd, params] = command.split(':');
        const stepType = this.commandToStep[cmd] || 'Perform action';
        
        return `    step('${stepType}', () => {\n      ${this.formatStepDescription(cmd, params)}\n    });\n`;
    }

    private formatStepDescription(command: string, params: string): string {
        // Remove quotes and format parameters for readability
        const cleanParams = params.replace(/['"]/g, '').trim();
        
        switch (command) {
            case 'visit':
                return `// Navigate to URL: ${cleanParams}`;
            case 'click':
                return `// Click element: ${cleanParams}`;
            case 'type':
                return `// Enter text into element: ${cleanParams}`;
            case 'should':
                return `// Verify condition: ${cleanParams}`;
            default:
                return `// ${command}: ${cleanParams}`;
        }
    }

    private convertSetupSteps(suite: TestSuite): string {
        if (!suite.beforeAll?.length && !suite.beforeEach?.length) {
            return '';
        }

        let steps = '  // Setup Steps\n';
        if (suite.beforeAll?.length) {
            steps += this.convertHooksToSteps(suite.beforeAll, 'Initial setup');
        }
        if (suite.beforeEach?.length) {
            steps += this.convertHooksToSteps(suite.beforeEach, 'Before each test');
        }
        return steps;
    }

    private convertTeardownSteps(suite: TestSuite): string {
        if (!suite.afterAll?.length && !suite.afterEach?.length) {
            return '';
        }

        let steps = '  // Teardown Steps\n';
        if (suite.afterEach?.length) {
            steps += this.convertHooksToSteps(suite.afterEach, 'After each test');
        }
        if (suite.afterAll?.length) {
            steps += this.convertHooksToSteps(suite.afterAll, 'Final teardown');
        }
        return steps;
    }

    private convertHooksToSteps(hooks: string[], description: string): string {
        let result = '';
        hooks.forEach((hook, index) => {
            result += `    step('${description} ${index + 1}', () => {\n`;
            result += `      // ${hook.trim()}\n`;
            result += '    });\n';
        });
        return result;
    }

    private generateWarnings(): string[] {
        const warnings: string[] = [];
        
        if (this.sourceCode.includes('cy.intercept(')) {
            warnings.push('Network interception commands cannot be directly converted to TestRail steps');
        }
        if (this.sourceCode.includes('cy.wait(')) {
            warnings.push('Wait commands will need manual review in TestRail steps');
        }
        if (this.sourceCode.includes('cy.fixture(')) {
            warnings.push('Fixture usage will need to be handled differently in TestRail');
        }

        return warnings;
    }
}