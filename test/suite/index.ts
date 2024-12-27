import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';

export function run(): Promise<void> {
 const mocha = new Mocha({
   ui: 'bdd',
   color: true
 });

 const testsRoot = path.resolve(__dirname);

 return new Promise((resolve, reject) => {
   glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
     if (err) {
       return reject(err);
     }

     // Add test files
     files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

     try {
       mocha.run(failures => {
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
 });
}

// Import all test files
import './extension.test';

// Core tests
import './core/parser.test';
import './core/astHelper.test';
import './core/converter.test';

// Feature tests  
import './features/settings.test';
import './features/highlighting.test';

// Integration tests
import './integration/concurrency.test';
import './integration/security.test';
import './integration/e2e.test';
