"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CypressToTestRailConverter = void 0;
const base_converter_1 = require("../base-converter");
const cypress_patterns_1 = require("../../test-patterns/cypress-patterns");
class CypressToTestRailConverter extends base_converter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.commandToStep = {
            'visit': 'Navigate to',
            'click': 'Click',
            'type': 'Enter text',
            'check': 'Check',
            'uncheck': 'Uncheck',
            'select': 'Select',
            'should': 'Verify',
            'contains': 'Verify element contains'
        };
    }
    parseTestCases() {
        const testCases = [];
        let match;
        while ((match = cypress_patterns_1.cypressPatterns.testDefinition.exec(this.sourceCode)) !== null) {
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
    parseSuites() {
        const suites = [];
        let match;
        while ((match = cypress_patterns_1.cypressPatterns.suiteDefinition.exec(this.sourceCode)) !== null) {
            const title = match[2];
            const startIndex = match.index + match[0].length;
            const suiteBody = this.extractBody(this.sourceCode.slice(startIndex));
            suites.push({
                title,
                tests: this.parseTestCases(),
                beforeAll: this.extractHooks(suiteBody, cypress_patterns_1.cypressPatterns.beforeAll),
                afterAll: this.extractHooks(suiteBody, cypress_patterns_1.cypressPatterns.afterAll),
                beforeEach: this.extractHooks(suiteBody, cypress_patterns_1.cypressPatterns.beforeEach),
                afterEach: this.extractHooks(suiteBody, cypress_patterns_1.cypressPatterns.afterEach)
            });
        }
        return suites;
    }
    convertToTargetFramework() {
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
                warnings: this.generateWarnings()
            };
        }
        catch (error) {
            return this.handleError(error);
        }
    }
    extractBody(code) {
        let braceCount = 1;
        let index = 0;
        while (braceCount > 0 && index < code.length) {
            if (code[index] === '{')
                braceCount++;
            if (code[index] === '}')
                braceCount--;
            index++;
        }
        return code.slice(0, index - 1);
    }
    extractAssertions(testBody) {
        const assertions = [];
        let match;
        while ((match = cypress_patterns_1.cypressPatterns.assertion.exec(testBody)) !== null) {
            assertions.push(match[1]);
        }
        return assertions;
    }
    extractHooks(code, pattern) {
        const hooks = [];
        let match;
        while ((match = pattern.exec(code)) !== null) {
            const hookBody = this.extractBody(code.slice(match.index + match[0].length));
            hooks.push(hookBody);
        }
        return hooks;
    }
    convertSuite(testSuite) {
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
    convertTestCase(testCase) {
        let result = `  test_case('${testCase.title}', () => {\n`;
        // Convert Cypress commands to TestRail steps
        const steps = this.extractCypressCommands(testCase.body);
        steps.forEach(step => {
            result += this.convertCommandToStep(step);
        });
        result += '  });\n\n';
        return result;
    }
    extractCypressCommands(testBody) {
        const commands = [];
        const commandPattern = /cy\.([\w]+)\((.*?)\)/g;
        let match;
        while ((match = commandPattern.exec(testBody)) !== null) {
            commands.push(`${match[1]}:${match[2]}`);
        }
        return commands;
    }
    convertCommandToStep(command) {
        const [cmd, params] = command.split(':');
        const stepType = this.commandToStep[cmd] || 'Perform action';
        return `    step('${stepType}', () => {\n      ${this.formatStepDescription(cmd, params)}\n    });\n`;
    }
    formatStepDescription(command, params) {
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
    convertSetupSteps(suite) {
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
    convertTeardownSteps(suite) {
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
    convertHooksToSteps(hooks, description) {
        let result = '';
        hooks.forEach((hook, index) => {
            result += `    step('${description} ${index + 1}', () => {\n`;
            result += `      // ${hook.trim()}\n`;
            result += '    });\n';
        });
        return result;
    }
    generateWarnings() {
        const warnings = [];
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
exports.CypressToTestRailConverter = CypressToTestRailConverter;
//# sourceMappingURL=to-testrail.js.map