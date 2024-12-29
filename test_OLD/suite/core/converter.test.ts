import { expect } from 'chai';
import { describe, it } from 'mocha';
import { TestConverter } from '../../../src/converters/converter';

describe('Test Converter', () => {
    describe('Cypress to Playwright', () => {
        it('should convert basic test structure', () => {
            const cypress = `
                describe('Test Suite', () => {
                    it('should work', () => {
                        cy.visit('/test');
                    });
                });
            `;
            const converter = new TestConverter();
            const result = converter.convertToPlaywright(cypress);
            expect(result).to.include('test.describe');
            expect(result).to.include('test(');
            expect(result).to.include('page.goto');
        });
    });

    describe('Playwright to TestRail', () => {
        it('should convert basic test structure', () => {
            const playwright = `
                test.describe('Test Suite', () => {
                    test('should work', async ({ page }) => {
                        await page.goto('/test');
                    });
                });
            `;
            const converter = new TestConverter();
            const result = converter.convertToTestRail(playwright);
            expect(result).to.include('suite(');
            expect(result).to.include('testCase(');
            expect(result).to.include('step(');
        });
    });
});
