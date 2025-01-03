import { CypressToPlaywrightConverter } from './cypress/to-playwright';
import { PlaywrightToTestRailConverter } from './playwright/to-testrail';

export class TestConverter {
    convertToPlaywright(source: string): string {
        const converter = new CypressToPlaywrightConverter(source);
        const result = converter.convertToTargetFramework();
        return result.convertedCode;
    }

    convertToTestRail(source: string): string {
        const converter = new PlaywrightToTestRailConverter(source);
        const result = converter.convertToTargetFramework();
        return result.convertedCode;
    }
}
