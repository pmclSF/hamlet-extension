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
const path = __importStar(require("path"));
const test_electron_1 = require("@vscode/test-electron");
async function main() {
    try {
        const projectRoot = process.cwd();
        const extensionDevelopmentPath = projectRoot;
        const extensionTestsPath = path.resolve(projectRoot, 'out/test/suite/index.js');
        // Log more information about our test setup
        console.log('Project Root:', projectRoot);
        console.log('Extension Development Path:', extensionDevelopmentPath);
        console.log('Extension Tests Path:', extensionTestsPath);
        // Try to execute the run function directly first
        console.log('\n🔍 Attempting direct test execution...');
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const testModule = require(extensionTestsPath);
            console.log('Test module loaded. Available exports:', Object.keys(testModule));
            if (typeof testModule.run === 'function') {
                console.log('Found run function, executing directly...');
                await testModule.run();
                console.log('Direct test execution completed successfully');
            }
            else {
                console.log('No run function found in test module');
            }
        }
        catch (directErr) {
            console.error('Direct test execution failed:', directErr);
            if (directErr instanceof Error) {
                console.error('Stack trace:', directErr.stack);
            }
        }
        // Then try the VSCode test runner
        console.log('\n🚀 Starting VSCode test runner...');
        const testResults = await (0, test_electron_1.runTests)({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                '--disable-gpu',
                '--headless',
                '--verbose'
            ],
            extensionTestsEnv: {
                MOCHA_REPORTER: 'spec',
                MOCHA_TIMEOUT: '60000',
                VSCODE_DEBUG_EXTENSION_HOST: 'true'
            }
        });
        console.log('VSCode test run completed with results:', testResults);
    }
    catch (err) {
        console.error('\n❌ Test run failed:', err);
        if (err instanceof Error) {
            console.error('Stack trace:', err.stack);
        }
        process.exit(1);
    }
}
main().catch(err => {
    console.error('\n💥 Unhandled error in test execution:', err);
    if (err instanceof Error) {
        console.error('Stack trace:', err.stack);
    }
    process.exit(1);
});
//# sourceMappingURL=runTest.js.map