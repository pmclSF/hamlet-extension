#!/bin/bash

# Update the index.ts file
echo "Updating test index file..."
cat > ./test/suite/index.ts << 'EOL'
import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';
import * as fs from 'fs';

export function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        timeout: 60000
    });

    const testsRoot = path.resolve(__dirname, '.');

    return new Promise((resolve, reject) => {
        glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
            if (err) {
                return reject(err);
            }

            // Add non-empty files to the test suite
            files.forEach(f => {
                const filePath = path.resolve(testsRoot, f);
                // Check if file is empty
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.trim().length > 0) {
                    mocha.addFile(filePath);
                } else {
                    console.log(`Skipping empty test file: ${f}`);
                }
            });

            try {
                // Run the mocha test
                mocha.run(failures => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    });
}
EOL

echo "Setup complete! Please run:"
echo "1. npm run compile"
echo "2. npm test"