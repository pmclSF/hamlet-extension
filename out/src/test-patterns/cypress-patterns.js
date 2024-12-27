"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cypressPatterns = void 0;
exports.cypressPatterns = {
    testDefinition: /it\s*\(\s*(['"`])(.*?)\1\s*,\s*(?:async\s*)?\(\s*\)\s*=>\s*{/g,
    suiteDefinition: /describe\s*\(\s*(['"`])(.*?)\1\s*,\s*(?:async\s*)?\(\s*\)\s*=>\s*{/g,
    assertion: /(?:should|expect|assert)\s*\((.*?)\)/g,
    command: /cy\.(.*?)\(/g,
    beforeEach: /beforeEach\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*{/g,
    afterEach: /afterEach\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*{/g,
    beforeAll: /before\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*{/g,
    afterAll: /after\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*{/g
};
//# sourceMappingURL=cypress-patterns.js.map