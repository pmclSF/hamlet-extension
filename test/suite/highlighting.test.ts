import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

suite('Hamlet Highlighting Validation', () => {
    // Option 2: Use process.cwd() + 'test/samples'
    // This way, we're referencing the actual source directory,
    // not the compiled output folder.
    const sampleFiles = [
        path.join(process.cwd(), 'test', 'samples', 'cypress-sample.ts'),
        path.join(process.cwd(), 'test', 'samples', 'playwright-sample.ts'),
        path.join(process.cwd(), 'test', 'samples', 'testrail-sample.ts')
    ];

    test('Sample files exist', () => {
        sampleFiles.forEach(file => {
            assert.ok(
                fs.existsSync(file), 
                `Sample file ${file} should exist`
            );
        });
    });

    test('Highlighting configuration matches sample files', () => {
        // Retrieve your extension's configuration:
        const configuration = vscode.workspace.getConfiguration('hamlet.highlighting');

        // Validate a setting is enabled:
        assert.strictEqual(
            configuration.get('enabled'), 
            true, 
            'Highlighting should be enabled'
        );

        // Validate expected color settings:
        const expectedColors = {
            cypress: '#04C38E',
            playwright: '#2EAD33',
            testrail: '#126BC5'
        };

        Object.entries(expectedColors).forEach(([framework, color]) => {
            assert.strictEqual(
                configuration.get(`colors.${framework}`),
                color,
                `${framework} color should match configuration`
            );
        });

        // Validate which components are highlighted:
        const expectedComponents = {
            assertions: true,
            hooks: true,
            commands: true
        };

        const currentComponents = configuration.get('components');

        assert.deepStrictEqual(
            currentComponents,
            expectedComponents,
            'Highlighting components should match default configuration'
        );
    });
});