import { ParsedBlock } from '../types/index';

export class TestParser {
    private source: string;
    private debugMode: boolean;

    constructor(source: string, debug: boolean = false) {
        this.source = source;
        this.debugMode = debug;
    }

    private log(...args: any[]) {
        if (this.debugMode) {
            console.log(...args);
        }
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
        const blockStack: Array<{
            block: ParsedBlock;
            bodyLines: string[];
            bracketCount: number;
        }> = [];

        this.log('Starting parse...');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            if (!trimmedLine) continue;

            // Count brackets in this line
            const openBrackets = (trimmedLine.match(/\{/g) || []).length;
            const closeBrackets = (trimmedLine.match(/\}/g) || []).length;

            // Update bracket count for all active blocks
            blockStack.forEach(item => {
                item.bracketCount += openBrackets - closeBrackets;
            });

            // Start of a describe block
            if (trimmedLine.startsWith('describe(')) {
                const titleMatch = trimmedLine.match(/describe\(['"](.+?)['"]/);
                if (titleMatch) {
                    const block: ParsedBlock = {
                        type: 'suite',
                        title: titleMatch[1],
                        body: '',
                        startLine: i + 1,
                        endLine: -1
                    };
                    blockStack.push({
                        block,
                        bodyLines: [line],
                        bracketCount: openBrackets
                    });
                    blocks.push(block);
                }
            }
            // Start of a test block
            else if (trimmedLine.startsWith('it(')) {
                const titleMatch = trimmedLine.match(/it\(['"](.+?)['"]/);
                if (titleMatch) {
                    const block: ParsedBlock = {
                        type: 'test',
                        title: titleMatch[1],
                        body: '',
                        startLine: i + 1,
                        endLine: -1
                    };
                    blockStack.push({
                        block,
                        bodyLines: [line],
                        bracketCount: openBrackets
                    });
                    blocks.push(block);
                }
            }

            // Add line to all active blocks
            blockStack.forEach(item => {
                item.bodyLines.push(line);
            });

            // Check for completed blocks
            while (blockStack.length > 0) {
                const last = blockStack[blockStack.length - 1];
                if (last.bracketCount === 0) {
                    last.block.body = last.bodyLines.join('\n');
                    last.block.endLine = i + 1;
                    blockStack.pop();
                } else {
                    break;
                }
            }
        }

        // Handle any unclosed blocks
        blockStack.forEach(item => {
            item.block.body = item.bodyLines.join('\n');
            item.block.endLine = lines.length;
        });

        if (this.debugMode) {
            this.logParseResults(blocks);
        }

        return blocks;
    }

    private logParseResults(blocks: ParsedBlock[]) {
        this.log('\nParse Results:');
        this.log(`Total blocks: ${blocks.length}`);
        
        if (blocks.length > 0) {
            this.log('\nFirst Block:');
            this.log({
                type: blocks[0].type,
                title: blocks[0].title,
                startLine: blocks[0].startLine,
                endLine: blocks[0].endLine,
                bodyPreview: blocks[0].body.slice(0, 100) + (blocks[0].body.length > 100 ? '...' : '')
            });
        }
    }
}