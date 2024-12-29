#!/usr/bin/env bash

#
# unify-tests.sh
#
# This script:
#   1. Removes or renames the top-level "test" folder (to unify under "src/test").
#   2. Updates tsconfig.json to:
#       - Set "rootDir" = "src"
#       - Only include "src/**/*"
#   3. Updates package.json "test:unit" and "test:integration" scripts to look in "src/test/**/*.test.ts"
#   4. Leaves existing "npm test" alone (which calls the compiled runTest.js).
#
# Usage: 
#   chmod +x unify-tests.sh
#   ./unify-tests.sh
#

# --- 1. Remove or rename top-level test folder if it exists ---
if [ -d "test" ]; then
  echo "Found a top-level test/ folder."
  # Either remove it entirely...
  # rm -rf test
  # echo "Removed top-level test folder."

  # OR rename it to something like 'test_OLD' in case you want to keep it around for reference:
  mv test test_OLD
  echo "Renamed top-level test folder to test_OLD."
else
  echo "No top-level test folder found, skipping removal."
fi


# --- 2. Overwrite tsconfig.json to unify tests under src/test ---

# We'll create a new tsconfig.json content (adjust as needed):
NEW_TSCONFIG="$(cat << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": [
      "ES2020",
      "DOM",
      "DOM.Iterable"
    ],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noImplicitAny": true
  },
  "exclude": [
    "node_modules",
    ".vscode-test"
  ],
  "include": [
    "src/**/*"
  ]
}
EOF
)"

# Write it out to tsconfig.json
echo "$NEW_TSCONFIG" > tsconfig.json
echo "Updated tsconfig.json to use rootDir=src and include=src/**/*."


# --- 3. Update package.json test scripts referencing top-level test folder ---

# For example, if you have "test:unit" or "test:integration" scripts that do:
#   "mocha --config .mocharc.json \"test/**/*.test.ts\""
# we’ll update them to:
#   "mocha --config .mocharc.json \"src/test/**/*.test.ts\""
#
# We’ll do this using a simple sed replacement. Adjust if your script names or patterns differ.

if [ -f "package.json" ]; then
  sed -i.bak 's|"test/**/*.test.ts"|"src/test/**/*.test.ts"|g' package.json
  rm package.json.bak 2>/dev/null || true
  echo "Updated package.json test:unit/test:integration to reference src/test/**/*.test.ts"
else
  echo "No package.json found, skipping script modifications."
fi

# --- 4. Done ---
echo
echo "Done! Your tests should now be unified under src/test."
echo " - tsconfig.json updated."
echo " - package.json test scripts adjusted."
echo " - Top-level test folder renamed (or removed)."
echo
echo "Next steps:"
echo "  1. Make sure your 'src/test/runTest.ts' references the compiled test suite at './out/src/test/suite/index'."
echo "  2. Confirm everything compiles: npm run compile"
echo "  3. Run your extension tests: npm test"