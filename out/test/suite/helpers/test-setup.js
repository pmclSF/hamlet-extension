"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sinon = exports.vscode = exports.expect = void 0;
exports.getSamplePath = getSamplePath;
exports.openTestDocument = openTestDocument;
const chai_1 = require("chai");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return chai_1.expect; } });
const vscode = __importStar(require("vscode"));
exports.vscode = vscode;
const sinon = __importStar(require("sinon"));
exports.sinon = sinon;
const path = __importStar(require("path"));
// Utility function to get sample file paths
function getSamplePath(filename) {
    return path.resolve(__dirname, '../../samples', filename);
}
// VS Code test helpers
async function openTestDocument(content, language = 'typescript') {
    return await vscode.workspace.openTextDocument({
        language,
        content
    });
}
//# sourceMappingURL=test-setup.js.map