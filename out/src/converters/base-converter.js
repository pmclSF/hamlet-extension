"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseConverter = void 0;
class BaseConverter {
    constructor(sourceCode) {
        this.sourceCode = sourceCode;
    }
    sanitizeCode(code) {
        return code.trim();
    }
    handleError(error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return {
            success: false,
            convertedCode: '',
            errors: [errorMessage]
        };
    }
}
exports.BaseConverter = BaseConverter;
//# sourceMappingURL=base-converter.js.map