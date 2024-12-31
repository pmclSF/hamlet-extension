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
        const blockStack: { block: ParsedBlock; indent: number }[] = [];
        
        let currentIndent = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Skip empty lines
            if (!trimmedLine) {
                continue;
            }

            // Calculate indentation level
            currentIndent = line.length - trimmedLine.length;

            // Handle block starts
            if (trimmedLine.startsWith('describe(')) {
                const titleMatch = trimmedLine.match(/describe\(['"](.+?)['"]/);
                if (titleMatch) {
                    const block: ParsedBlock = {
                        type: 'suite',
                        title: titleMatch[1],
                        body: line,
                        startLine: i + 1,
                        endLine: -1
                    };
                    blockStack.push({ block, indent: currentIndent });
                    blocks.push(block);
                }
            }
            else if (trimmedLine.startsWith('it(')) {
                const titleMatch = trimmedLine.match(/it\(['"](.+?)['"]/);
                if (titleMatch) {
                    const block: ParsedBlock = {
                        type: 'test',
                        title: titleMatch[1],
                        body: line,
                        startLine: i + 1,
                        endLine: -1
                    };
                    blockStack.push({ block, indent: currentIndent });
                    blocks.push(block);
                }
            }
            else if (trimmedLine.match(/^(before|after|beforeEach|afterEach)\(/)) {
                const titleMatch = trimmedLine.match(/(before|after|beforeEach|afterEach)/);
                if (titleMatch) {
                    const block: ParsedBlock = {
                        type: 'hook',
                        title: titleMatch[1],
                        body: line,
                        startLine: i + 1,
                        endLine: -1
                    };
                    blockStack.push({ block, indent: currentIndent });
                    blocks.push(block);
                }
            }

            // Add content to current block
            if (blockStack.length > 0) {
                const currentBlock = blockStack[blockStack.length - 1].block;
                currentBlock.body += '\n' + line;
            }

            // Handle block endings
            if (trimmedLine.includes('});')) {
                while (blockStack.length > 0) {
                    const lastBlock = blockStack[blockStack.length - 1];
                    if (currentIndent <= lastBlock.indent) {
                        lastBlock.block.endLine = i + 1;
                        blockStack.pop();
                    } else {
                        break;
                    }
                }
            }
        }

        // Close any remaining blocks
        blockStack.forEach(({ block }) => {
            if (block.endLine === -1) {
                block.endLine = lines.length;
            }
        });

        // Debug logging
        console.log(`Parsed ${blocks.length} blocks`);
        if (blocks.length > 0) {
            console.log('First block:', {
                type: blocks[0].type,
                title: blocks[0].title,
                startLine: blocks[0].startLine,
                endLine: blocks[0].endLine,
                bodyPreview: blocks[0].body.substring(0, 100)
            });
        }

        return blocks;
    }
}