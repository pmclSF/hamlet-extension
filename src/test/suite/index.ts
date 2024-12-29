import * as path from 'path';
import Mocha = require('mocha');  // Fix the import style

export async function run(): Promise<void> {
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
        return new Promise<void>((resolve, reject) => {
            mocha.run((failures: number) => {  // Add type for failures
                console.log('Test run completed with', failures, 'failures');
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        });
    } catch (err) {
        console.error('Error during test execution:', err);
        throw err;
    }
}

// Ensure module exports are correct
exports.run = run;