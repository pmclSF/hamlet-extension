export const playwrightPatterns = {
    testDefinition: /test\s*\(\s*(['"`])(.*?)\1\s*,\s*async\s*\(\s*{\s*page\s*}\s*\)\s*=>\s*{/g,
    suiteDefinition: /test\.describe\s*\(\s*(['"`])(.*?)\1\s*,\s*\(\s*\)\s*=>\s*{/g,
    assertion: /expect\s*\((.*?)\)\.(.*?)\(/g,
    pageAction: /page\.(.*?)\(/g,
    beforeEach: /test\.beforeEach\s*\(\s*async\s*\(\s*{\s*page\s*}\s*\)\s*=>\s*{/g,
    afterEach: /test\.afterEach\s*\(\s*async\s*\(\s*{\s*page\s*}\s*\)\s*=>\s*{/g,
    beforeAll: /test\.beforeAll\s*\(\s*async\s*\(\s*\)\s*=>\s*{/g,
    afterAll: /test\.afterAll\s*\(\s*async\s*\(\s*\)\s*=>\s*{/g
};