import path from 'path';
import Mocha from 'mocha';
import { promisify } from 'util';
import { glob } from 'glob';

export async function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'bdd',
        color: true
    });

    const testsRoot = path.resolve(__dirname);
    const globPromise = promisify(glob);
    const files = await globPromise('**/**.test.js', { cwd: testsRoot });
    
    files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

    return new Promise((resolve, reject) => {
        try {
            mocha.run((failures: number) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}

// Import tests
import './core/parser.test';
import './core/astHelper.test';
import './features/highlighting.test';
import './integration/security.test';
