"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightToCypressConverter = void 0;
const base_converter_1 = require("../base-converter");
class PlaywrightToCypressConverter extends base_converter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.actionMappings = {
            'goto': 'visit',
            'locator': 'get',
            'getByText': 'contains',
            'click': 'click',
            'fill': 'type',
            'check': 'check',
            'uncheck': 'uncheck',
            'selectOption': 'select'
        };
    }
    parseTestCases() {
        const testCases = [];
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
    parseSuites() {
        const suites = [];
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
        const assertionPattern = /expect\((.*?)\)\.(.*?)\(/g;
        let match;
        while ((match = assertionPattern.exec(testBody)) !== null) {
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
    convertSuite(suite) {
        let result = `describe('${suite.title}', () => {\n`;
        // Convert hooks
        if (suite.beforeAll?.length) {
            result += this.convertHooks('before', suite.beforeAll);
        }
        if (suite.afterAll?.length) {
            result += this.convertHooks('after', suite.afterAll);
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
    convertTestCase(testCase) {
        let convertedBody = testCase.body;
        // Convert Playwright actions to Cypress commands
        Object.entries(this.actionMappings).forEach(([playwrightAction, cypressCmd]) => {
            convertedBody = convertedBody.replace(new RegExp(`page.${playwrightAction}\\(`, 'g'), `cy.${cypressCmd}(`);
        });
        // Convert assertions
        convertedBody = convertedBody.replace(/expect\((.*?)\)\.(.*?)\(/g, (_, selector, assertion) => `cy.get(${selector}).should('${this.convertAssertion(assertion)}',`);
        return `  it('${testCase.title}', () => {\n${convertedBody}  });\n\n`;
    }
    convertHooks(hookType, hooks) {
        return hooks.map(hook => `  ${hookType}(() => {\n${this.convertBody(hook)}  });\n\n`).join('');
    }
    convertBody(code) {
        return code.replace(/await\s+/g, '');
    }
    convertAssertion(playwrightAssertion) {
        const assertionMap = {
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
    generateWarnings() {
        return [
            'Playwright route.fulfill() needs manual conversion to cy.intercept()',
            'Consider replacing waitForLoadState with appropriate Cypress commands',
            'Browser context management needs manual conversion for Cypress'
        ].filter(warning => this.sourceCode.includes(warning.split(' ')[0]));
    }
}
exports.PlaywrightToCypressConverter = PlaywrightToCypressConverter;
//# sourceMappingURL=to-cypress.js.map