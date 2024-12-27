import assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

suite('Hamlet Highlighting Validation', () => {
   const sampleFiles = [
       path.join(__dirname, '../samples/cypress-sample.ts'),
       path.join(__dirname, '../samples/playwright-sample.ts'),
       path.join(__dirname, '../samples/testrail-sample.ts')
   ];

   test('Sample files exist', () => {
       sampleFiles.forEach(file => {
           assert.ok(fs.existsSync(file), `Sample file ${file} should exist`);
       });
   });

   test('Highlighting configuration matches sample files', () => {
       const configuration = vscode.workspace.getConfiguration('hamlet.highlighting');
       
       assert.strictEqual(configuration.get('enabled'), true, 'Highlighting should be enabled');
       
       const expectedColors = {
           cypress: '#04C38E',
           playwright: '#2EAD33',
           testrail: '#126BC5'
       };

       const expectedComponents = {
           assertions: true,
           hooks: true,
           commands: true
       };

       Object.entries(expectedColors).forEach(([framework, color]) => {
           assert.strictEqual(
               configuration.get(`colors.${framework}`), 
               color, 
               `${framework} color should match configuration`
           );
       });

       const currentComponents = configuration.get('components');
       assert.deepStrictEqual(
           currentComponents, 
           expectedComponents, 
           'Highlighting components should match default configuration'
       );
   });
});
