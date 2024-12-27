import { ParsedBlock } from '../types/index';

export class TestParser {
    private source: string;

    constructor(source: string) {
        this.source = source;
    }

    detectFramework(): 'cypress' | 'playwright' | 'testrail' | null {
        if (this.source.includes('cy.')) return 'cypress';
        if (this.source.includes('test(')) return 'playwright';
        if (this.source.includes('test_case(')) return 'testrail';
        return null;
    }

    parseBlocks(): ParsedBlock[] {
        return [];
    }
}
