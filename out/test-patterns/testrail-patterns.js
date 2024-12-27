"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testrailPatterns = void 0;
exports.testrailPatterns = {
    testDefinition: /test_case\s*\(\s*(['"`])(.*?)\1\s*,\s*\(\s*\)\s*=>\s*{/g,
    suiteDefinition: /suite\s*\(\s*(['"`])(.*?)\1\s*,\s*\(\s*\)\s*=>\s*{/g,
    assertion: /assert\.(.*?)\(/g,
    step: /step\s*\(\s*(['"`])(.*?)\1\s*,\s*\(\s*\)\s*=>\s*{/g,
    beforeEach: /beforeEach\s*\(\s*\(\s*\)\s*=>\s*{/g,
    afterEach: /afterEach\s*\(\s*\)\s*=>\s*{/g,
    beforeAll: /beforeAll\s*\(\s*\)\s*=>\s*{/g,
    afterAll: /afterAll\s*\(\s*\)\s*=>\s*{/g
};
//# sourceMappingURL=testrail-patterns.js.map