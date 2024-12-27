const path = require('path');
const Mocha = require('mocha');
const { glob } = require('glob');

async function run() {
   const mocha = new Mocha({
       ui: 'tdd',
       color: true
   });

   const testsRoot = path.resolve(__dirname, '.');

   return new Promise((resolve, reject) => {
       glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
           if (err) {
               reject(err);
               return;
           }

           files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

           mocha.run(failures => {
               if (failures > 0) {
                   reject(new Error(`${failures} tests failed.`));
               } else {
                   resolve();
               }
           });
       });
   });
}

module.exports = { run };
