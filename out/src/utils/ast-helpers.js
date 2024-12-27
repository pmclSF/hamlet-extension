"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTHelper = void 0;
class ASTHelper {
    /**
     * Creates an AST node for a test case
     */
    static createTestNode(title, body) {
        return {
            type: 'test',
            name: title,
            body,
            children: []
        };
    }
    /**
     * Creates an AST node for a test suite
     */
    static createSuiteNode(title) {
        return {
            type: 'suite',
            name: title,
            children: []
        };
    }
    /**
     * Creates an AST node for a hook (before/after)
     */
    static createHookNode(hookType, body) {
        return {
            type: 'hook',
            name: hookType,
            body,
            children: []
        };
    }
    /**
     * Creates an AST node for an assertion
     */
    static createAssertionNode(assertion, params) {
        return {
            type: 'assertion',
            value: assertion,
            params
        };
    }
    /**
     * Traverses an AST and applies a callback function to each node
     */
    static traverse(node, callback) {
        callback(node);
        if (node.children) {
            node.children.forEach(child => this.traverse(child, callback));
        }
    }
    /**
     * Converts a Cypress assertion to a Playwright assertion
     */
    static cypressToPlaywrightAssertion(node) {
        if (node.type !== 'assertion')
            return '';
        const assertionMap = {
            'be.visible': 'toBeVisible',
            'be.hidden': 'toBeHidden',
            'have.text': 'toHaveText',
            'have.value': 'toHaveValue',
            'be.checked': 'toBeChecked',
            'be.disabled': 'toBeDisabled',
            'be.enabled': 'toBeEnabled'
        };
        const assertion = node.value || '';
        return assertionMap[assertion] || assertion;
    }
    /**
     * Converts a Playwright assertion to a Cypress assertion
     */
    static playwrightToCypressAssertion(node) {
        if (node.type !== 'assertion')
            return '';
        const assertionMap = {
            'toBeVisible': 'be.visible',
            'toBeHidden': 'be.hidden',
            'toHaveText': 'have.text',
            'toHaveValue': 'have.value',
            'toBeChecked': 'be.checked',
            'toBeDisabled': 'be.disabled',
            'toBeEnabled': 'be.enabled'
        };
        const assertion = node.value || '';
        return assertionMap[assertion] || assertion;
    }
    /**
     * Converts assertions to TestRail steps
     */
    static assertionToTestRailStep(node) {
        if (node.type !== 'assertion')
            return '';
        return `step('Verify', () => {
    // ${node.value}
});`;
    }
    /**
     * Builds an AST from parsed test blocks
     */
    static buildAST(blocks) {
        const root = {
            type: 'root',
            children: []
        };
        let currentSuite = null;
        blocks.forEach(block => {
            if (block.type === 'suite') {
                currentSuite = this.createSuiteNode(block.title);
                root.children?.push(currentSuite);
            }
            else if (block.type === 'test' && currentSuite) {
                const testNode = this.createTestNode(block.title, block.body || '');
                currentSuite.children?.push(testNode);
            }
        });
        return root;
    }
    /**
     * Generates code from an AST node
     */
    static generateCode(node, framework) {
        switch (node.type) {
            case 'suite':
                return this.generateSuiteCode(node, framework);
            case 'test':
                return this.generateTestCode(node, framework);
            case 'hook':
                return this.generateHookCode(node, framework);
            case 'assertion':
                return this.generateAssertionCode(node, framework);
            default:
                return '';
        }
    }
    static generateSuiteCode(node, framework) {
        const name = node.name || 'Untitled Suite';
        const childrenCode = node.children
            ?.map(child => this.generateCode(child, framework))
            .join('\n\n') || '';
        switch (framework) {
            case 'cypress':
                return `describe('${name}', () => {\n${childrenCode}\n});`;
            case 'playwright':
                return `test.describe('${name}', () => {\n${childrenCode}\n});`;
            case 'testrail':
                return `suite('${name}', () => {\n${childrenCode}\n});`;
            default:
                return '';
        }
    }
    static generateTestCode(node, framework) {
        const name = node.name || 'Untitled Test';
        const body = node.body || '';
        switch (framework) {
            case 'cypress':
                return `it('${name}', () => {\n${body}\n});`;
            case 'playwright':
                return `test('${name}', async ({ page }) => {\n${body}\n});`;
            case 'testrail':
                return `test_case('${name}', () => {\n${body}\n});`;
            default:
                return '';
        }
    }
    static generateHookCode(node, framework) {
        const hookType = node.name || '';
        const body = node.body || '';
        switch (framework) {
            case 'cypress':
                return `${hookType}(() => {\n${body}\n});`;
            case 'playwright':
                const isEachHook = hookType.includes('Each');
                return `test.${hookType}(async (${isEachHook ? '{ page }' : ''}) => {\n${body}\n});`;
            case 'testrail':
                return `${hookType}(() => {\n${body}\n});`;
            default:
                return '';
        }
    }
    static generateAssertionCode(node, framework) {
        const assertion = node.value || '';
        const params = node.params || [];
        switch (framework) {
            case 'cypress':
                return `should('${assertion}', ${params.join(', ')})`;
            case 'playwright':
                return `expect(${params[0]}).${assertion}(${params.slice(1).join(', ')})`;
            case 'testrail':
                return this.assertionToTestRailStep(node);
            default:
                return '';
        }
    }
    /**
     * Finds all assertions in a test body
     */
    static findAssertions(testBody, framework) {
        const assertions = [];
        let match;
        const patterns = {
            cypress: /\.should\(['"](.+?)['"](?:,\s*(.+?))?\)/g,
            playwright: /expect\((.+?)\)\.(.+?)\((.+?)?\)/g,
            testrail: /assert\.(.+?)\((.+?)?\)/g
        };
        const pattern = patterns[framework];
        if (!pattern)
            return assertions;
        while ((match = pattern.exec(testBody)) !== null) {
            assertions.push(this.createAssertionNode(match[1], match.slice(2).filter(Boolean)));
        }
        return assertions;
    }
    /**
     * Updates parent references in the AST
     */
    static updateParentReferences(node, parent) {
        node.parent = parent;
        if (node.children) {
            node.children.forEach(child => this.updateParentReferences(child, node));
        }
    }
    /**
     * Clones an AST node and its children
     */
    static cloneNode(node) {
        const clone = { ...node };
        if (node.children) {
            clone.children = node.children.map(child => this.cloneNode(child));
        }
        return clone;
    }
    /**
     * Finds a node in the AST by its type and name
     */
    static findNode(root, type, name) {
        if (root.type === type && (!name || root.name === name)) {
            return root;
        }
        if (root.children) {
            for (const child of root.children) {
                const found = this.findNode(child, type, name);
                if (found)
                    return found;
            }
        }
        return null;
    }
}
exports.ASTHelper = ASTHelper;
//# sourceMappingURL=ast-helpers.js.map