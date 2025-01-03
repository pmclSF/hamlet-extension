import * as vscode from "vscode";
import * as assert from "assert";

export function assertBlockStructure(blocks: any[], expectedLength: number, message?: string) {
    assert.strictEqual(blocks.length, expectedLength, message || `Expected ${expectedLength} blocks`);
}

export async function executeCommandWithRetry(
    command: string,
    maxAttempts: number = 3
): Promise<void> {
    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts < maxAttempts) {
        try {
            if (attempts > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            await vscode.commands.executeCommand(command);
            // Wait for conversion to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            return;
        } catch (error) {
            console.log(`Attempt ${attempts + 1} failed:`, error);
            lastError = error as Error;
            attempts++;
            if (attempts === maxAttempts) break;
        }
    }

    throw lastError || new Error(`Command ${command} failed after ${maxAttempts} attempts`);
}

export async function openTestDocument(content: string): Promise<vscode.TextDocument> {
    const document = await vscode.workspace.openTextDocument({
        content: content.trim(),
        language: 'typescript'
    });

    await vscode.window.showTextDocument(document, {
        preview: false,
        preserveFocus: false
    });

    // Wait for document to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 500));

    return document;
}
