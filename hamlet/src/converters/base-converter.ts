import { TestCase, TestSuite, ConversionResult } from '../types';

export abstract class BaseConverter {
    protected sourceCode: string;

    constructor(sourceCode: string) {
        this.sourceCode = sourceCode;
    }

    abstract parseTestCases(): TestCase[];
    abstract parseSuites(): TestSuite[];
    abstract convertToTargetFramework(): ConversionResult;

    protected extractAssertion(line: string): string[] {
        return [];
    }

    protected convertAssertion(assertion: string): string {
        return '';
    }

    protected sanitizeCode(code: string): string {
        return code.trim();
    }
}