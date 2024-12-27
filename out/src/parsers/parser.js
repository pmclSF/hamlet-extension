"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestParser = void 0;
class TestParser {
    constructor(source) {
        this.source = source;
    }
    detectFramework() {
        if (this.source.includes('cy.'))
            return 'cypress';
        if (this.source.includes('test('))
            return 'playwright';
        if (this.source.includes('test_case('))
            return 'testrail';
        return null;
    }
    parseBlocks() {
        return [];
    }
}
exports.TestParser = TestParser;
//# sourceMappingURL=parser.js.map