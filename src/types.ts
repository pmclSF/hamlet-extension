export interface TestCase {
    title: string;
    body: string;
    assertions: string[];
    setup?: string[];
    teardown?: string[];
}

export interface TestSuite {
    title: string;
    tests: TestCase[];
    beforeAll?: string[];
    afterAll?: string[];
    beforeEach?: string[];
    afterEach?: string[];
}

export interface ConversionResult {
    success: boolean;
    convertedCode: string;
    errors: string[];
    warnings?: string[];
}