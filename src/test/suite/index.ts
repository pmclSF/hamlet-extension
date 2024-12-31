import * as path from "path";
import Mocha from "mocha";
import { glob } from "glob";

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: "bdd",
        color: true,
        timeout: 10000,
        reporter: 'spec' // Adding explicit reporter for better test output
    });

    const testsRoot = path.resolve(__dirname, "..");

    try {
        // Find all test files
        const files = await glob("**/**.test.js", { 
            cwd: testsRoot,
            ignore: ['**/node_modules/**'] // Explicitly ignore node_modules
        });

        if (files.length === 0) {
            throw new Error('No test files found');
        }

        // Log found test files for debugging
        console.log('Found test files:', files);

        // Add files to mocha
        files.forEach(f => {
            const fullPath = path.resolve(testsRoot, f);
            console.log(`Adding test file: ${fullPath}`);
            mocha.addFile(fullPath);
        });

        // Run the tests
        return new Promise((resolve, reject) => {
            try {
                mocha.run(failures => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        console.log('All tests passed successfully');
                        resolve();
                    }
                });
            } catch (err) {
                console.error('Error running tests:', err);
                reject(err);
            }
        });

    } catch (err) {
        console.error('Error setting up tests:', err);
        throw err;
    }
}

if (require.main === module) {
    run().catch(err => {
        console.error('Test run failed:', err);
        process.exit(1);
    });
}