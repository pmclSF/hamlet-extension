"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestParser = void 0;
var TestParser = /** @class */ (function () {
    function TestParser(source) {
        this.source = source;
    }
    TestParser.prototype.detectFramework = function () {
        if (this.source.includes('cy.'))
            return 'cypress';
        if (this.source.includes('test('))
            return 'playwright';
        if (this.source.includes('test_case('))
            return 'testrail';
        return null;
    };
    TestParser.prototype.parseBlocks = function () {
        return [];
    };
    return TestParser;
}());
exports.TestParser = TestParser;
