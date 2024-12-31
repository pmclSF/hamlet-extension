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
        const blocks: ParsedBlock[] = [];
        const lines = this.source.split('\n');
        let currentBlock: ParsedBlock | null = null;
        let currentBody: string[] = [];
        let blockDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Handle describe blocks (suites)
            if (line.includes('describe(')) {
                const titleMatch = line.match(/describe\(['"](.+?)['"]/);
                if (titleMatch) {
                    currentBlock = {
                        type: 'suite',
                        title: titleMatch[1],
                        body: '',
                        startLine: i + 1,
                        endLine: -1 // Will be updated when block ends
                    };
                    currentBody = [line];
                    blockDepth++;
                }
            }

            // Handle test blocks
            else if (line.includes('it(')) {
                const titleMatch = line.match(/it\(['"](.+?)['"]/);
                if (titleMatch) {
                    currentBlock = {
                        type: 'test',
                        title: titleMatch[1],
                        body: '',
                        startLine: i + 1,
                        endLine: -1
                    };
                    currentBody = [line];
                    blockDepth++;
                }
            }

            // Handle hooks (before, after, beforeEach, afterEach)
            else if (line.match(/^(before|after|beforeEach|afterEach)\(/)) {
                const hookMatch = line.match(/(before|after|beforeEach|afterEach)/);
                if (hookMatch) {
                    currentBlock = {
                        type: 'hook',
                        title: hookMatch[1],
                        body: '',
                        startLine: i + 1,
                        endLine: -1
                    };
                    currentBody = [line];
                    blockDepth++;
                }
            }

            // Collect body content
            if (currentBlock && currentBody) {
                if (blockDepth > 0 && i > currentBlock.startLine - 1) {
                    currentBody.push(line);
                }
            }

            // Handle block endings
            if (line.includes('});') || line.includes('}));')) {
                blockDepth--;
                if (blockDepth === 0 && currentBlock && currentBody) {
                    currentBlock.endLine = i + 1;
                    currentBlock.body = currentBody.join('\n');
                    blocks.push(currentBlock);
                    currentBlock = null;
                    currentBody = [];
                }
            }
        }

        return blocks;
    }
}