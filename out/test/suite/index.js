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
exports.run = run;
const path = __importStar(require("path"));
const Mocha = require("mocha"); // Fix the import style
async function run() {
    // Create the mocha test
    console.log('Creating Mocha instance...');
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        reporter: 'spec'
    });
    console.log('Setting up test file path...');
    const testsRoot = __dirname;
    console.log('Tests root:', testsRoot);
    // Add test file directly
    const testFile = path.resolve(testsRoot, 'extension.test.js');
    console.log('Adding test file:', testFile);
    mocha.addFile(testFile);
    try {
        console.log('Starting test run...');
        return new Promise((resolve, reject) => {
            mocha.run((failures) => {
                console.log('Test run completed with', failures, 'failures');
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                }
                else {
                    resolve();
                }
            });
        });
    }
    catch (err) {
        console.error('Error during test execution:', err);
        throw err;
    }
}
// Ensure module exports are correct
exports.run = run;
//# sourceMappingURL=index.js.map