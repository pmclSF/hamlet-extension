import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';
import { promisify } from 'util';

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        timeout: 60000
    });

    const testsRoot = path.resolve(__dirname);
    console.log('Tests root:', testsRoot);

    try {
        // Define the type for glob promise
        const globPromise = promisify<string, object, string[]>(glob);
        
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
        return new Promise<void>((resolve, reject) => {
            try {
                mocha.run((failures: number) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                console.error('Error running tests:', err);
                reject(err);
            }
        });
    } catch (err) {
        console.error('Error loading test files:', err);
        throw err;
    }
}
