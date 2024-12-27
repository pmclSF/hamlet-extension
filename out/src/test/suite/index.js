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
exports.run = run;
const path = __importStar(require("path"));
const mocha_1 = __importDefault(require("mocha"));
const glob_1 = require("glob");
const util_1 = require("util");
async function run() {
    // Create the mocha test
    const mocha = new mocha_1.default({
        ui: 'bdd',
        color: true,
        timeout: 60000
    });
    const testsRoot = path.resolve(__dirname);
    console.log('Tests root:', testsRoot);
    try {
        // Define the type for glob promise
        const globPromise = (0, util_1.promisify)(glob_1.glob);
        // Look for test files
        const files = await globPromise('**/**.test.js', { cwd: testsRoot });
        console.log('Found test files:', files);
        // Add files to the test suite
        for (const file of files) {
            const filePath = path.resolve(testsRoot, file);
            console.log('Adding test file:', filePath);
            mocha.addFile(filePath);
        }
        // Run the mocha tests
        return new Promise((resolve, reject) => {
            try {
                mocha.run((failures) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    }
                    else {
                        resolve();
                    }
                });
            }
            catch (err) {
                console.error('Error running tests:', err);
                reject(err);
            }
        });
    }
    catch (err) {
        console.error('Error loading test files:', err);
        throw err;
    }
}
//# sourceMappingURL=index.js.map