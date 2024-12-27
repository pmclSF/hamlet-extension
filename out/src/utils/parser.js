"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestParser = void 0;
class TestParser {
    constructor(source, options = {}) {
        this.source = source;
        this.options = {
            removeComments: true,
            preserveWhitespace: false,
            strictMode: false,
            ...options
        };
    }
    /**
     * Detects the test framework used in the source code
     */
    detectFramework() {
        const patterns = {
            cypress: /cy\.|describe\(|it\(|context\(/,
            playwright: /test\(|expect\(|page\./,
            testrail: /test_case\(|suite\(|section\(/
        };
        for (const [framework, pattern] of Object.entries(patterns)) {
            if (pattern.test(this.source)) {
                return framework;
            }
        }
        return null;
    }
    /**
     * Parses the source code into blocks
     */
    parseBlocks() {
        const blocks = [];
        const lines = this.source.split('\n');
        let currentBlock = null;
        let braceCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = this.options.removeComments ?
                this.removeComments(lines[i]) : lines[i];
            if (this.isBlockStart(line)) {
                currentBlock = this.createBlock(line, i);
                braceCount = 1;
            }
            else if (currentBlock) {
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;
                if (braceCount === 0) {
                    currentBlock.endLine = i;
                    currentBlock.body += line;
                    blocks.push(currentBlock);
                    currentBlock = null;
                }
                else {
                    currentBlock.body += line + '\n';
                }
            }
        }
        return blocks;
    }
    /**
     * Extracts assertions from a test block
     */
    extractAssertions(testBody) {
        const assertions = [];
        const framework = this.detectFramework();
        const patterns = {
            cypress: /(?:should|expect|assert)\((.*?)\)/g,
            playwright: /expect\((.*?)\)\.(.*?)\(/g,
            testrail: /assert\.(.*?)\(/g
        };
        const pattern = patterns[framework || 'cypress'];
        let match;
        while ((match = pattern.exec(testBody)) !== null) {
            assertions.push(match[1]);
        }
        return assertions;
    }
    /**
     * Extracts hooks (before/after) from a suite block
     */
    extractHooks(suiteBody) {
        const hooks = {
            beforeAll: [],
            beforeEach: [],
            afterEach: [],
            afterAll: []
        };
        const framework = this.detectFramework();
        const patterns = this.getHookPatterns(framework || 'cypress');
        for (const [hookType, pattern] of Object.entries(patterns)) {
            let match;
            while ((match = pattern.exec(suiteBody)) !== null) {
                const hookBody = this.extractBlockBody(suiteBody.slice(match.index));
                hooks[hookType].push(hookBody);
            }
        }
        return hooks;
    }
    /**
     * Converts parsed blocks to test cases and suites
     */
    convertBlocksToTestStructure(blocks) {
        const suites = [];
        let currentSuite = null;
        for (const block of blocks) {
            if (block.type === 'suite') {
                if (currentSuite) {
                    suites.push(currentSuite);
                }
                currentSuite = {
                    title: block.title || 'Untitled Suite',
                    tests: [],
                };
            }
            else if (block.type === 'test' && currentSuite) {
                currentSuite.tests.push({
                    title: block.title || 'Untitled Test',
                    body: block.body,
                    assertions: this.extractAssertions(block.body)
                });
            }
        }
        if (currentSuite) {
            suites.push(currentSuite);
        }
        return suites;
    }
    isBlockStart(line) {
        const blockStarters = {
            cypress: /(describe|it|context)\s*\(/,
            playwright: /(test|test\.describe)\s*\(/,
            testrail: /(test_case|suite|section)\s*\(/
        };
        const framework = this.detectFramework();
        return framework ? blockStarters[framework].test(line) : false;
    }
    createBlock(line, lineNumber) {
        const titleMatch = /'([^']*)'|"([^"]*)"|`([^`]*)`/.exec(line);
        const title = titleMatch ?
            (titleMatch[1] || titleMatch[2] || titleMatch[3]) : undefined;
        return {
            type: line.includes('describe') || line.includes('suite') ? 'suite' : 'test',
            title,
            body: line + '\n',
            startLine: lineNumber,
            endLine: -1
        };
    }
    removeComments(line) {
        // Remove single-line comments
        line = line.replace(/\/\/.*$/, '');
        // Remove multi-line comments (simplified)
        line = line.replace(/\/\*.*?\*\//g, '');
        return line;
    }
    extractBlockBody(code) {
        let braceCount = 0;
        let index = 0;
        let started = false;
        for (const char of code) {
            if (char === '{') {
                started = true;
                braceCount++;
            }
            else if (char === '}') {
                braceCount--;
            }
            if (started && braceCount === 0) {
                break;
            }
            index++;
        }
        return code.slice(0, index);
    }
    getHookPatterns(framework) {
        const patterns = {
            cypress: {
                beforeAll: /before\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*{/g,
                beforeEach: /beforeEach\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*{/g,
                afterEach: /afterEach\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*{/g,
                afterAll: /after\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*{/g
            },
            playwright: {
                beforeAll: /test\.beforeAll\s*\(\s*async\s*\(\s*\)\s*=>\s*{/g,
                beforeEach: /test\.beforeEach\s*\(\s*async\s*\(\s*{\s*page\s*}\s*\)\s*=>\s*{/g,
                afterEach: /test\.afterEach\s*\(\s*async\s*\(\s*{\s*page\s*}\s*\)\s*=>\s*{/g,
                afterAll: /test\.afterAll\s*\(\s*async\s*\(\s*\)\s*=>\s*{/g
            },
            testrail: {
                beforeAll: /beforeAll\s*\(\s*\(\s*\)\s*=>\s*{/g,
                beforeEach: /beforeEach\s*\(\s*\(\s*\)\s*=>\s*{/g,
                afterEach: /afterEach\s*\(\s*\(\s*\)\s*=>\s*{/g,
                afterAll: /afterAll\s*\(\s*\(\s*\)\s*=>\s*{/g
            }
        };
        return patterns[framework] || patterns.cypress;
    }
}
exports.TestParser = TestParser;
//# sourceMappingURL=parser.js.map