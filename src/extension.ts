import * as vscode from 'vscode';
import { CypressToPlaywrightConverter } from './converters/cypress/to-playwright';
import { PlaywrightToTestRailConverter } from './converters/playwright/to-testrail';
import { TestRailToCypressConverter } from './converters/testrail/to-cypress';
import { TestParser } from './parsers/parser';
import { ConversionResult } from './types';

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
            const parser = new TestParser(editor.document.getText());
            const framework = parser.detectFramework();
            
            if (framework === 'cypress') {
                const converter = new CypressToPlaywrightConverter(editor.document.getText());
                await handleConversion(converter, editor);
            } else if (framework === 'testrail') {
                const converter = new TestRailToCypressConverter(editor.document.getText());
                await handleConversion(converter, editor);
            } else {
                vscode.window.showErrorMessage('Current file is not a supported test file');
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
            const parser = new TestParser(editor.document.getText());
            const framework = parser.detectFramework();

            if (framework === 'playwright') {
                const converter = new CypressToPlaywrightConverter(editor.document.getText());
                await handleConversion(converter, editor);
            } else {
                vscode.window.showErrorMessage('Current file is not a supported test file');
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
            const parser = new TestParser(editor.document.getText());
            const framework = parser.detectFramework();

            if (framework === 'playwright') {
                const converter = new PlaywrightToTestRailConverter(editor.document.getText());
                await handleConversion(converter, editor);
            } else {
                vscode.window.showErrorMessage('Current file is not a supported test file');
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

async function handleConversion(converter: IConverter, editor: vscode.TextEditor): Promise<void> {
    try {
        const result = converter.convertToTargetFramework();
        
        if (result.warnings?.length) {
            result.warnings.forEach((warning: string) => {
                outputChannel.appendLine(`Warning: ${warning}`);
            });
        }

        if (result.success) {
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(
                editor.document.positionAt(0),
                editor.document.positionAt(editor.document.getText().length)
            );
            edit.replace(editor.document.uri, fullRange, result.convertedCode);
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Conversion successful!');
        } else {
            throw new Error(result.errors?.[0] || 'Conversion failed');
        }
    } catch (error) {
        handleError(error);
    }
}

function handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    outputChannel.appendLine(`Error: ${message}`);
    vscode.window.showErrorMessage(`Error during conversion: ${message}`);
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}