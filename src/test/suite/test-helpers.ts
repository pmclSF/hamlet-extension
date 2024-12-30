import * as vscode from "vscode";
import * as assert from "assert";

export async function openTestDocument(content: string): Promise<vscode.TextDocument> {
    const document = await vscode.workspace.openTextDocument({
        content,
        language: "typescript"
    });
    await vscode.window.showTextDocument(document);
    return document;
}

export function assertBlockStructure(blocks: any[], expectedLength: number, message?: string) {
    assert.strictEqual(blocks.length, expectedLength, message || `Expected ${expectedLength} blocks`);
}

export async function executeCommandWithRetry(command: string, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
        try {
            await vscode.commands.executeCommand(command);
            return;
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
