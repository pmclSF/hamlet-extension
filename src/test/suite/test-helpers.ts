import * as vscode from "vscode";
import * as assert from "assert";

export async function openTestDocument(content: string): Promise<vscode.TextDocument> {
    // Create document
    const document = await vscode.workspace.openTextDocument({
        content: content.trim(),
        language: 'typescript'
    });

    // Show document
    const editor = await vscode.window.showTextDocument(document, {
        preview: false,
        preserveFocus: false
    });

    // Ensure document is ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Format document
    await vscode.commands.executeCommand('editor.action.formatDocument');
    
    return document;
}

export function assertBlockStructure(blocks: any[], expectedLength: number, message?: string) {
    assert.strictEqual(blocks.length, expectedLength, message || `Expected ${expectedLength} blocks`);
}

export async function executeCommandWithRetry(
    command: string,
    maxAttempts: number = 3
): Promise<void> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await vscode.commands.executeCommand(command);
            return;
        } catch (error) {
            console.log(`Attempt ${i + 1} failed:`, error);
            lastError = error as Error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    throw lastError || new Error(`Command ${command} failed after ${maxAttempts} attempts`);
}
