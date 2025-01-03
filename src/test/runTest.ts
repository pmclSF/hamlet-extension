import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        const projectRoot = process.cwd();
        const extensionDevelopmentPath = projectRoot;
        const extensionTestsPath = path.resolve(projectRoot, 'out/test/suite/index.js');

        // Log information about test setup
        console.log('Project Root:', projectRoot);
        console.log('Extension Development Path:', extensionDevelopmentPath);
        console.log('Extension Tests Path:', extensionTestsPath);

        console.log('\n🚀 Starting VSCode test runner...');
        const testResults = await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                '--disable-gpu',
                '--disable-extensions',
                '--no-sandbox'
            ],
            extensionTestsEnv: {
                MOCHA_REPORTER: 'spec',
                MOCHA_TIMEOUT: '60000',
                ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
                ELECTRON_NO_ATTACH_CONSOLE: 'true'
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