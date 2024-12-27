import * as vscode from 'vscode';

export class SettingsPanel {
    public static currentPanel: SettingsPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, _extensionUri: vscode.Uri) {
        this._panel = panel;
        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'updateSetting':
                        void vscode.workspace.getConfiguration('hamlet').update(
                            message.setting,
                            message.value,
                            vscode.ConfigurationTarget.Global
                        );
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (SettingsPanel.currentPanel) {
            SettingsPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'hamletSettings',
            'Hamlet Settings',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        SettingsPanel.currentPanel = new SettingsPanel(panel, extensionUri);
    }

    private _update() {
        this._panel.webview.html = this._getHtmlForWebview();
    }

    private _getHtmlForWebview(): string {
        const config = vscode.workspace.getConfiguration('hamlet');
        const currentSource = config.get('frameworks.defaultSource');
        const currentTarget = config.get('frameworks.defaultTarget');
        const highlightingEnabled = config.get('highlighting.enabled');
        const indentationType = config.get('codeStyle.indentation');
        const quoteStyle = config.get('codeStyle.quoteStyle');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hamlet Settings</title>
            <style>
                body {
                    padding: 20px;
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                }
                .setting-group {
                    margin-bottom: 20px;
                    padding: 15px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 5px;
                }
                .setting-title {
                    font-size: 1.2em;
                    margin-bottom: 10px;
                    color: var(--vscode-settings-headerForeground);
                }
                .setting-item {
                    margin: 10px 0;
                }
                select, input {
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 5px;
                    border-radius: 3px;
                }
                button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                }
                .keyboard-shortcut {
                    background: var(--vscode-textBlockQuote-background);
                    padding: 10px;
                    margin-top: 5px;
                    border-radius: 3px;
                    font-family: monospace;
                }
            </style>
        </head>
        <body>
            <div class="setting-group">
                <div class="setting-title">Framework Settings</div>
                <div class="setting-item">
                    <label>Default Source Framework:</label>
                    <select id="defaultSource" onchange="updateSetting('frameworks.defaultSource', this.value)">
                        <option value="cypress" ${currentSource === 'cypress' ? 'selected' : ''}>Cypress</option>
                        <option value="playwright" ${currentSource === 'playwright' ? 'selected' : ''}>Playwright</option>
                        <option value="testrail" ${currentSource === 'testrail' ? 'selected' : ''}>TestRail</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Default Target Framework:</label>
                    <select id="defaultTarget" onchange="updateSetting('frameworks.defaultTarget', this.value)">
                        <option value="cypress" ${currentTarget === 'cypress' ? 'selected' : ''}>Cypress</option>
                        <option value="playwright" ${currentTarget === 'playwright' ? 'selected' : ''}>Playwright</option>
                        <option value="testrail" ${currentTarget === 'testrail' ? 'selected' : ''}>TestRail</option>
                    </select>
                </div>
            </div>

            <div class="setting-group">
                <div class="setting-title">Keyboard Shortcuts</div>
                <div class="setting-item">
                    <span>Convert to Playwright:</span>
                    <div class="keyboard-shortcut">Ctrl/Cmd + Shift + T P</div>
                </div>
                <div class="setting-item">
                    <span>Convert to Cypress:</span>
                    <div class="keyboard-shortcut">Ctrl/Cmd + Shift + T C</div>
                </div>
                <div class="setting-item">
                    <span>Convert to TestRail:</span>
                    <div class="keyboard-shortcut">Ctrl/Cmd + Shift + T R</div>
                </div>
            </div>

            <div class="setting-group">
                <div class="setting-title">Highlighting Options</div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" 
                               ${highlightingEnabled ? 'checked' : ''}
                               onchange="updateSetting('highlighting.enabled', this.checked)">
                        Enable Test Highlighting
                    </label>
                </div>
            </div>

            <div class="setting-group">
                <div class="setting-title">Code Style</div>
                <div class="setting-item">
                    <label>Indentation:</label>
                    <select onchange="updateSetting('codeStyle.indentation', this.value)">
                        <option value="spaces" ${indentationType === 'spaces' ? 'selected' : ''}>Spaces</option>
                        <option value="tabs" ${indentationType === 'tabs' ? 'selected' : ''}>Tabs</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Quote Style:</label>
                    <select onchange="updateSetting('codeStyle.quoteStyle', this.value)">
                        <option value="single" ${quoteStyle === 'single' ? 'selected' : ''}>Single Quotes</option>
                        <option value="double" ${quoteStyle === 'double' ? 'selected' : ''}>Double Quotes</option>
                    </select>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function updateSetting(setting, value) {
                    vscode.postMessage({
                        command: 'updateSetting',
                        setting: setting,
                        value: value
                    });
                }
            </script>
        </body>
        </html>`;
    }

    public dispose() {
        SettingsPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}