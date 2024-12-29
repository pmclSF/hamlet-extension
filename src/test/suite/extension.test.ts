console.log('Running tests in src/test/suite/extension.test.ts');
import { describe, it } from 'mocha';
import { expect } from 'chai';

describe('Extension Test Suite', () => {
    it('Sample test', () => {
        console.log('Running sample test');
        expect(true).to.be.true;
    });
});
