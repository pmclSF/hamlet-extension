import * as path from 'path';
import { runTests } from '@vscode/test-electron';

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
            const testModule = require(extensionTestsPath) as { run: () => Promise<void> };
            console.log('Test module loaded. Available exports:', Object.keys(testModule));
            
            if (typeof testModule.run === 'function') {
                console.log('Found run function, executing directly...');
                await testModule.run();
                console.log('Direct test execution completed successfully');
            } else {
                console.log('No run function found in test module');
            }
        } catch (directErr) {
            console.error('Direct test execution failed:', directErr);
            if (directErr instanceof Error) {
                console.error('Stack trace:', directErr.stack);
            }
        }

        // Then try the VSCode test runner
        console.log('\n🚀 Starting VSCode test runner...');
        const testResults = await runTests({
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

    } catch (err) {
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