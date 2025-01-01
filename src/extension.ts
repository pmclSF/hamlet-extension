import * as vscode from 'vscode';
import { CypressToPlaywrightConverter } from './converters/cypress/to-playwright';
import { PlaywrightToTestRailConverter } from './converters/playwright/to-testrail';
import { TestRailToCypressConverter } from './converters/testrail/to-cypress';
import { TestParser } from './parsers/parser';
import { ConversionResult } from './types';
import { PlaywrightToCypressConverter } from './converters/playwright/to-cypress';

interface IConverter {
    convertToTargetFramework(): ConversionResult;
}

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('Hamlet');
    outputChannel.show(true);
    outputChannel.appendLine('Hamlet is now active!');

    // Register framework detection command
    let detectFramework = vscode.commands.registerCommand('hamlet.detectFramework', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const parser = new TestParser(editor.document.getText());
            const framework = parser.detectFramework();
            outputChannel.appendLine(`Detected framework: ${framework}`);
            return framework;
        }
        return null;
    });

    // Register conversion commands
    let convertToPlaywright = vscode.commands.registerCommand('hamlet.convertToPlaywright', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            outputChannel.appendLine('Starting conversion to Playwright...');
            const sourceCode = editor.document.getText();
            const parser = new TestParser(sourceCode);
            const framework = parser.detectFramework();
            
            if (framework === 'cypress') {
                const converter = new CypressToPlaywrightConverter(sourceCode);
                await handleConversion(converter, editor);
            } else if (framework === 'testrail') {
                const converter = new TestRailToCypressConverter(sourceCode);
                const intermediateResult = await handleConversion(converter, editor);
                if (intermediateResult) {
                    const playwrightConverter = new CypressToPlaywrightConverter(editor.document.getText());
                    await handleConversion(playwrightConverter, editor);
                }
            } else {
                throw new Error('Current file is not a supported test file');
            }
        } catch (error) {
            handleError(error);
        }
    });

    let convertToCypress = vscode.commands.registerCommand('hamlet.convertToCypress', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            outputChannel.appendLine('Starting conversion to Cypress...');
            const sourceCode = editor.document.getText();
            const parser = new TestParser(sourceCode);
            const framework = parser.detectFramework();

            if (framework === 'playwright') {
                // Fix: Use PlaywrightToCypressConverter instead of CypressToPlaywrightConverter
                const converter = new PlaywrightToCypressConverter(sourceCode);
                await handleConversion(converter, editor);
            } else {
                throw new Error('Current file is not a supported test file');
            }
        } catch (error) {
            handleError(error);
        }
    });

    let convertToTestRail = vscode.commands.registerCommand('hamlet.convertToTestRail', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        try {
            outputChannel.appendLine('Starting conversion to TestRail...');
            const sourceCode = editor.document.getText();
            const parser = new TestParser(sourceCode);
            const framework = parser.detectFramework();

            if (framework === 'playwright') {
                const converter = new PlaywrightToTestRailConverter(sourceCode);
                await handleConversion(converter, editor);
            } else {
                throw new Error('Current file is not a supported test file');
            }
        } catch (error) {
            handleError(error);
        }
    });

    context.subscriptions.push(
        detectFramework,
        convertToPlaywright,
        convertToCypress,
        convertToTestRail,
        outputChannel
    );
}

async function handleConversion(converter: IConverter, editor: vscode.TextEditor): Promise<boolean> {
    try {
        const result = converter.convertToTargetFramework();
        
        if (!result.success) {
            throw new Error(result.errors?.join('\n') || 'Conversion failed');
        }

        if (result.warnings?.length) {
            result.warnings.forEach((warning: string) => {
                outputChannel.appendLine(`Warning: ${warning}`);
            });
        }

        if (!result.convertedCode) {
            throw new Error('No converted code generated');
        }
        
        // Log the conversion
        outputChannel.appendLine('Converting:');
        outputChannel.appendLine('Original: ' + editor.document.getText().substring(0, 100) + '...');
        outputChannel.appendLine('Converted: ' + result.convertedCode.substring(0, 100) + '...');
        
        // Apply the conversion
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(editor.document.getText().length)
        );
        
        edit.replace(editor.document.uri, fullRange, result.convertedCode);
        const success = await vscode.workspace.applyEdit(edit);
        
        if (success) {
            vscode.window.showInformationMessage('Conversion successful!');
            return true;
        } else {
            throw new Error('Failed to apply conversion');
        }
    } catch (error) {
        handleError(error);
        return false;
    }
}

function handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    outputChannel.appendLine(`Error: ${message}`);
    if (error instanceof Error && error.stack) {
        outputChannel.appendLine(`Stack trace: ${error.stack}`);
    }
    vscode.window.showErrorMessage(`Error during conversion: ${message}`);
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}