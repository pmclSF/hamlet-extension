import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import { glob } from 'glob';
import { promisify } from 'util';

const globPromise = promisify<string, object, string[]>(glob);

async function main() {
    try {
        const projectRoot = process.cwd();
        const extensionDevelopmentPath = projectRoot;
        const extensionTestsPath = path.resolve(projectRoot, 'out/test/suite/index.js');

        // Add file system check
        const fs = require('fs');
        console.log('Checking if test path exists:', extensionTestsPath);
        console.log('Path exists:', fs.existsSync(extensionTestsPath));
        console.log('Directory contents:', fs.readdirSync(path.dirname(extensionTestsPath)));

        // Try to require the index file directly
        console.log('🔍 Attempting to require index file...');
        try {
            const indexModule = require(extensionTestsPath);
            console.log('📦 Index module contents:', Object.keys(indexModule));
            if (indexModule.run) {
                console.log('✅ Found run function in module');
            } else {
                console.log('❌ No run function found in module');
            }
        } catch (err) {
            console.error('💥 Error requiring index file:', err);
        }

        console.log('Project Root:', projectRoot);
        console.log('Extension Development Path:', extensionDevelopmentPath);
        console.log('Extension Tests Path:', extensionTestsPath);

        const testsRoot = path.resolve(projectRoot, 'out/test/suite');
        const testFiles = await globPromise('**/*.test.js', { cwd: testsRoot });
        console.log('Test root exists:', fs.existsSync(testsRoot));
        console.log('Discovered Test Files:', testFiles);

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ['--disable-gpu', '--headless'],
            extensionTestsEnv: {
                MOCHA_REPORTER: 'spec',
                MOCHA_TIMEOUT: '60000',
            },
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        if (err instanceof Error) {
            console.error('Error stack:', err.stack);
        }
        process.exit(1);
    }
}

main();