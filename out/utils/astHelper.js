"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTHelper = void 0;
class ASTHelper {
    static createTestNode(title, body) {
        return {
            type: 'test',
            name: title,
            body,
            children: []
        };
    }
    static createSuiteNode(title) {
        return {
            type: 'suite',
            name: title,
            children: []
        };
    }
    static createHookNode(hookType, body) {
        return {
            type: 'hook',
            name: hookType,
            body,
            children: []
        };
    }
    static traverse(node, callback) {
        callback(node);
        if (node.children) {
            node.children.forEach((child) => this.traverse(child, callback));
        }
    }
    static cypressToPlaywrightAssertion(node) {
        if (node.type !== 'assertion')
            return '';
        const assertionMap = {
            'be.visible': 'toBeVisible',
            'be.hidden': 'toBeHidden'
        };
        return assertionMap[node.value || ''] || '';
    }
    static playwrightToCypressAssertion(node) {
        if (node.type !== 'assertion')
            return '';
        const assertionMap = {
            'toBeVisible': 'be.visible',
            'toBeHidden': 'be.hidden'
        };
        return assertionMap[node.value || ''] || '';
    }
    static generateCode(node, framework) {
        switch (node.type) {
            case 'suite':
                switch (framework) {
                    case 'cypress': return `describe('${node.name}', () => {});`;
                    case 'playwright': return `test.describe('${node.name}', () => {});`;
                    case 'testrail': return `suite('${node.name}', () => {});`;
                }
                break;
            default:
                return '';
        }
        return '';
    }
}
exports.ASTHelper = ASTHelper;
//# sourceMappingURL=astHelper.js.map