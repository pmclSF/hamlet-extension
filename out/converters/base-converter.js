"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseConverter = void 0;
class BaseConverter {
    constructor(sourceCode) {
        this.sourceCode = sourceCode;
    }
    extractAssertion(line) {
        return [];
    }
    convertAssertion(assertion) {
        return '';
    }
    sanitizeCode(code) {
        return code.trim();
    }
}
exports.BaseConverter = BaseConverter;
//# sourceMappingURL=base-converter.js.map