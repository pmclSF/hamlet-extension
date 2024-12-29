"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestConverter = void 0;
const to_playwright_1 = require("./cypress/to-playwright");
const to_testrail_1 = require("./playwright/to-testrail");
class TestConverter {
    convertToPlaywright(source) {
        const converter = new to_playwright_1.CypressToPlaywrightConverter(source);
        const result = converter.convertToTargetFramework();
        return result.convertedCode;
    }
    convertToTestRail(source) {
        const converter = new to_testrail_1.PlaywrightToTestRailConverter(source);
        const result = converter.convertToTargetFramework();
        return result.convertedCode;
    }
}
exports.TestConverter = TestConverter;
//# sourceMappingURL=converter.js.map