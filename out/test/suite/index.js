"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path_1 = __importDefault(require("path"));
const mocha_1 = __importDefault(require("mocha"));
const glob_1 = require("glob");
const util_1 = require("util");
require("mocha");
async function run() {
    // Create the mocha test
    const mocha = new mocha_1.default({
        ui: 'bdd',
        color: true,
        timeout: 60000
    });
    const testsRoot = path_1.default.resolve(__dirname);
    console.log('Looking for tests in:', testsRoot);
    const globPromise = (0, util_1.promisify)(glob_1.glob);
    try {
        // Look for TypeScript files that have been compiled to JavaScript
        const files = await globPromise('**/*.test.js', { cwd: testsRoot });
        console.log('Found test files:', files);
        // Add files to mocha
        for (const file of files) {
            const filePath = path_1.default.resolve(testsRoot, file);
            console.log('Adding test file:', filePath);
            mocha.addFile(filePath);
        }
        return new Promise((resolve, reject) => {
            try {
                mocha.run((failures) => {
                    if (failures > 0) {
                        console.error(`${failures} tests failed`);
                        reject(new Error(`${failures} tests failed.`));
                    }
                    else {
                        console.log('All tests passed!');
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