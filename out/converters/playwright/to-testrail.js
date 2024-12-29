"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightToTestRailConverter = void 0;
const base_converter_1 = require("../base-converter");
class PlaywrightToTestRailConverter extends base_converter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.actionToStep = {
            'goto': 'Navigate to',
            'click': 'Click',
            'fill': 'Enter text',
            'check': 'Check',
            'uncheck': 'Uncheck',
            'selectOption': 'Select',
            'getByText': 'Locate text',
            'getByRole': 'Locate element by role',
            'getByTestId': 'Locate element by test ID'
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
            convertedCode += `const { testCase, suite, step } = require('@testrail/api');\n\n`;
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
            assertions.push(`${match[1]}.${match[2]}`);
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
        let result = `  testCase('${testCase.title}', () => {\n`;
        // Convert Playwright actions to TestRail steps
        const steps = this.extractPlaywrightActions(testCase.body);
        steps.forEach(step => {
            result += this.convertActionToStep(step);
        });
        // Convert assertions to verification steps
        testCase.assertions.forEach(assertion => {
            result += this.convertAssertionToStep(assertion);
        });
        result += '  });\n\n';
        return result;
    }
    extractPlaywrightActions(testBody) {
        const actions = [];
        const actionPattern = /page\.([\w]+)\((.*?)\)/g;
        let match;
        while ((match = actionPattern.exec(testBody)) !== null) {
            actions.push(`${match[1]}:${match[2]}`);
        }
        return actions;
    }
    convertActionToStep(action) {
        const [cmd, params] = action.split(':');
        const stepType = this.actionToStep[cmd] || 'Perform action';
        return `    step('${stepType}', () => {\n      ${this.formatStepDescription(cmd, params)}\n    });\n`;
    }
    convertAssertionToStep(assertion) {
        return `    step('Verify', () => {\n      // Verify ${assertion}\n    });\n`;
    }
    formatStepDescription(command, params) {
        // Remove quotes and format parameters for readability
        const cleanParams = params.replace(/['"]/g, '').trim();
        switch (command) {
            case 'goto':
                return `// Navigate to URL: ${cleanParams}`;
            case 'click':
                return `// Click element: ${cleanParams}`;
            case 'fill':
                return `// Enter text into element: ${cleanParams}`;
            case 'getByText':
                return `// Locate element containing text: ${cleanParams}`;
            case 'getByRole':
                return `// Locate element by role: ${cleanParams}`;
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
        if (this.sourceCode.includes('route.fulfill')) {
            warnings.push('Network interception commands cannot be directly converted to TestRail steps');
        }
        if (this.sourceCode.includes('waitForLoadState')) {
            warnings.push('Wait commands will need manual review in TestRail steps');
        }
        if (this.sourceCode.includes('storageState')) {
            warnings.push('Storage state handling will need to be managed differently in TestRail');
        }
        return warnings;
    }
}
exports.PlaywrightToTestRailConverter = PlaywrightToTestRailConverter;
//# sourceMappingURL=to-testrail.js.map