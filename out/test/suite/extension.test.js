"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log('Running tests in src/test/suite/extension.test.ts');
const mocha_1 = require("mocha");
const chai_1 = require("chai");
(0, mocha_1.describe)('Extension Test Suite', () => {
    (0, mocha_1.it)('Sample test', () => {
        console.log('Running sample test');
        (0, chai_1.expect)(true).to.be.true;
    });
});
//# sourceMappingURL=extension.test.js.map