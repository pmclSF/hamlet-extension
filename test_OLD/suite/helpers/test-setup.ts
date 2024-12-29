import { expect } from 'chai';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as path from 'path';

// Utility function to get sample file paths
export function getSamplePath(filename: string): string {
    return path.resolve(__dirname, '../../samples', filename);
}

// VS Code test helpers
export async function openTestDocument(content: string, language = 'typescript'): Promise<vscode.TextDocument> {
    return await vscode.workspace.openTextDocument({
        language,
        content
    });
}

// Export commonly used test dependencies
export {
    expect,
    vscode,
    sinon
};
