"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRailToCypressConverter = void 0;
const base_converter_1 = require("../base-converter");
const testrail_patterns_1 = require("../../test-patterns/testrail-patterns");
class TestRailToCypressConverter extends base_converter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.stepToCypressCommand = {
            'Navigate to': 'cy.visit',
            'Click': 'cy.click',
            'Enter text': 'cy.type',
            'Verify': 'cy.should',
            'Check': 'cy.check',
            'Select': 'cy.select'
        };
    }
    parseTestCases() {
        const testCases = [];
        let match;
        while ((match = testrail_patterns_1.testrailPatterns.testDefinition.exec(this.sourceCode)) !== null) {
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
    parseSuites() {
        const suites = [];
        let match;
        while ((match = testrail_patterns_1.testrailPatterns.suiteDefinition.exec(this.sourceCode)) !== null) {
            const title = match[2];
            const startIndex = match.index + match[0].length;
            const suiteBody = this.extractBody(this.sourceCode.slice(startIndex));
            suites.push({
                title,
                tests: this.parseTestCases(),
                beforeAll: this.extractHooks(suiteBody, testrail_patterns_1.testrailPatterns.beforeAll),
                afterAll: this.extractHooks(suiteBody, testrail_patterns_1.testrailPatterns.afterAll),
                beforeEach: this.extractHooks(suiteBody, testrail_patterns_1.testrailPatterns.beforeEach),
                afterEach: this.extractHooks(suiteBody, testrail_patterns_1.testrailPatterns.afterEach)
            });
        }
        return suites;
    }
    convertToTargetFramework() {
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
        }
        catch (error) {
            return this.handleError(error);
        }
    }
    convertSuite(suite) {
        let result = `describe('${suite.title}', () => {\n`;
        // Convert TestRail steps to Cypress commands
        for (const test of suite.tests) {
            result += this.convertTestCase(test);
        }
        result += '});\n\n';
        return result;
    }
    convertTestCase(testCase) {
        const steps = this.extractSteps(testCase.body);
        let cypressCommands = steps.map(step => this.convertStepToCypressCommand(step));
        return `  it('${testCase.title}', () => {\n    ${cypressCommands.join('\n    ')}\n  });\n\n`;
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
    extractSteps(testBody) {
        const steps = [];
        let match;
        while ((match = testrail_patterns_1.testrailPatterns.step.exec(testBody)) !== null) {
            steps.push(match[2]);
        }
        return steps;
    }
    extractStepAssertions(testBody) {
        const assertions = [];
        let match;
        while ((match = testrail_patterns_1.testrailPatterns.assertion.exec(testBody)) !== null) {
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
    convertStepToCypressCommand(step) {
        for (const [keyword, command] of Object.entries(this.stepToCypressCommand)) {
            if (step.startsWith(keyword)) {
                const param = step.slice(keyword.length).trim();
                return `${command}('${param}');`;
            }
        }
        return `// TODO: Convert step: ${step}`;
    }
    generateWarnings() {
        return ['Some TestRail steps may require manual adjustment for Cypress syntax'];
    }
}
exports.TestRailToCypressConverter = TestRailToCypressConverter;
//# sourceMappingURL=to-cypress.js.map