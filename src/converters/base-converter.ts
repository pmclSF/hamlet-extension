import { TestCase, TestSuite, ConversionResult } from '../types';

export abstract class BaseConverter {
    protected sourceCode: string;

    constructor(sourceCode: string) {
        this.sourceCode = sourceCode;
    }

    abstract parseTestCases(): TestCase[];
    abstract parseSuites(): TestSuite[];
    abstract convertToTargetFramework(): ConversionResult;

    protected sanitizeCode(code: string): string {
        return code.trim();
    }

    protected handleError(error: unknown): ConversionResult {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return {
            success: false,
            convertedCode: '',
            errors: [errorMessage]
        };
    }
}