import * as vscode from 'vscode';
import { SettingsPanel } from './panels/SettingsPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Hamlet is now active!');

    // Register Settings Panel Command
    let settingsCommand = vscode.commands.registerCommand('hamlet.showSettings', () => {
        SettingsPanel.createOrShow(context.extensionUri);
    });

    context.subscriptions.push(settingsCommand);
}

export function deactivate() {}