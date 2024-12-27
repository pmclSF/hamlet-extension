import { ASTNode } from '../types/index';

export class ASTHelper {
    static createTestNode(title: string, body: string): ASTNode {
        return {
            type: 'test',
            name: title,
            body,
            children: []
        };
    }

    static createSuiteNode(title: string): ASTNode {
        return {
            type: 'suite',
            name: title,
            children: []
        };
    }

    static createHookNode(hookType: string, body: string): ASTNode {
        return {
            type: 'hook',
            name: hookType,
            body,
            children: []
        };
    }

    static traverse(node: ASTNode, callback: (node: ASTNode) => void): void {
        callback(node);
        if (node.children) {
            node.children.forEach((child: ASTNode) => this.traverse(child, callback));
        }
    }

    static cypressToPlaywrightAssertion(node: ASTNode): string {
        if (node.type !== 'assertion') return '';
        const assertionMap: Record<string, string> = {
            'be.visible': 'toBeVisible',
            'be.hidden': 'toBeHidden'
        };
        return assertionMap[node.value || ''] || '';
    }

    static playwrightToCypressAssertion(node: ASTNode): string {
        if (node.type !== 'assertion') return '';
        const assertionMap: Record<string, string> = {
            'toBeVisible': 'be.visible',
            'toBeHidden': 'be.hidden'
        };
        return assertionMap[node.value || ''] || '';
    }

    static generateCode(node: ASTNode, framework: 'cypress' | 'playwright' | 'testrail'): string {
        switch (node.type) {
            case 'suite':
                return `describe('${node.name}', () => {});`;
            default:
                return '';
        }
    }
}
