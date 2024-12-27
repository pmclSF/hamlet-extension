export interface ASTNode {
    type: string;
    name?: string;
    value?: string;
    children?: ASTNode[];
    parent?: ASTNode;
    body?: string;
    params?: unknown[];
}

export interface ParsedBlock {
    type: 'suite' | 'test' | 'hook';
    title?: string;
    body: string;
    startLine: number;
    endLine: number;
}

export interface TestCase {
    title: string;
    body: string;
    assertions: string[];
}

export interface TestSuite {
    title: string;
    tests: TestCase[];
}
