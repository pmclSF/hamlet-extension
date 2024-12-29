import { Suite } from 'mocha';

declare global {
    const describe: typeof Suite.prototype.describe;
    const it: typeof Suite.prototype.it;
    const before: typeof Suite.prototype.before;
    const after: typeof Suite.prototype.after;
    const beforeEach: typeof Suite.prototype.beforeEach;
    const afterEach: typeof Suite.prototype.afterEach;
}
