
// Add to the top of extension.ts
import { SettingsPanel } from './panels/SettingsPanel';

// Add inside the activate function
let settingsCommand = vscode.commands.registerCommand('hamlet.showSettings', () => {
    SettingsPanel.createOrShow(context.extensionUri);
});

context.subscriptions.push(settingsCommand);
