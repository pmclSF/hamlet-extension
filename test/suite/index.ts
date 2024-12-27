import path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';
import { promisify } from 'util';
import 'mocha';

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        timeout: 60000
    });

    const testsRoot = path.resolve(__dirname);
    console.log('Looking for tests in:', testsRoot);
    
    const globPromise = promisify<string, { cwd: string }, string[]>(glob);

    try {
        // Look for TypeScript files that have been compiled to JavaScript
        const files = await globPromise('**/*.test.js', { cwd: testsRoot });
        console.log('Found test files:', files);

        // Add files to mocha
        for (const file of files) {
            const filePath = path.resolve(testsRoot, file);
            console.log('Adding test file:', filePath);
            mocha.addFile(filePath);
        }

        return new Promise<void>((resolve, reject) => {
            try {
                mocha.run((failures: number) => {
                    if (failures > 0) {
                        console.error(`${failures} tests failed`);
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        console.log('All tests passed!');
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
