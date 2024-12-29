#!/bin/bash

# Check if the .js files are being generated in the out/test/suite directory
echo "Checking for compiled .js files..."
if ls out/test/suite/*.test.js >/dev/null 2>&1; then
  echo "Found compiled .js files:"
  ls out/test/suite/*.test.js
else
  echo "No .js files found in out/test/suite. Check TypeScript compilation."
  exit 1
fi

# Modify runTest.ts
echo "Modifying runTest.ts..."
sed -i '' 's/const testFiles = await globPromise.*/&\
console.log("Discovered test files:", testFiles);/' src/test/runTest.ts

# Modify index.ts
echo "Modifying index.ts..."
cat > src/test/suite/index.ts <<EOL
import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';
import { promisify } from 'util';

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'bdd',
    color: true,
    reporter: 'spec'
  });

  const testsRoot = path.resolve(__dirname);
  const files = await promisify(glob)('**/*.test.js', { cwd: testsRoot });

  files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

  await new Promise(resolve => setTimeout(resolve, 1000));

  return new Promise<void>((resolve, reject) => {
    mocha.run(failures => {
      if (failures > 0) {
        reject(new Error(\`\${failures} tests failed.\`));
      } else {
        resolve();
      }
    });
  });
}
EOL

# Add console.log statements to each .test.ts file
echo "Adding console.log statements to .test.ts files..."
for file in src/test/**/*.test.ts; do
  echo "console.log('Running tests in $file');" | cat - "$file" > temp && mv temp "$file"
done

echo "Script completed. Run the tests again to see if the changes helped."