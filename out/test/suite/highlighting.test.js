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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
suite('Hamlet Highlighting Validation', () => {
    // Option 2: Use process.cwd() + 'test/samples'
    // This way, we're referencing the actual source directory,
    // not the compiled output folder.
    const sampleFiles = [
        path.join(process.cwd(), 'test', 'samples', 'cypress-sample.ts'),
        path.join(process.cwd(), 'test', 'samples', 'playwright-sample.ts'),
        path.join(process.cwd(), 'test', 'samples', 'testrail-sample.ts')
    ];
    test('Sample files exist', () => {
        sampleFiles.forEach(file => {
            assert_1.default.ok(fs.existsSync(file), `Sample file ${file} should exist`);
        });
    });
    test('Highlighting configuration matches sample files', () => {
        // Retrieve your extension's configuration:
        const configuration = vscode.workspace.getConfiguration('hamlet.highlighting');
        // Validate a setting is enabled:
        assert_1.default.strictEqual(configuration.get('enabled'), true, 'Highlighting should be enabled');
        // Validate expected color settings:
        const expectedColors = {
            cypress: '#04C38E',
            playwright: '#2EAD33',
            testrail: '#126BC5'
        };
        Object.entries(expectedColors).forEach(([framework, color]) => {
            assert_1.default.strictEqual(configuration.get(`colors.${framework}`), color, `${framework} color should match configuration`);
        });
        // Validate which components are highlighted:
        const expectedComponents = {
            assertions: true,
            hooks: true,
            commands: true
        };
        const currentComponents = configuration.get('components');
        assert_1.default.deepStrictEqual(currentComponents, expectedComponents, 'Highlighting components should match default configuration');
    });
});
//# sourceMappingURL=highlighting.test.js.map