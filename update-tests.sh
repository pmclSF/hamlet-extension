#!/usr/bin/env bash
#
# update-tests.sh
#
# Copies new converter test files into hamlet/test/unit, then compiles and tests.

# Exit on any error
set -e

#############################################
# 1. Define paths for the new test files
#############################################

# Assuming you placed your new test files in a local folder named 'new-tests-snippets'
NEW_TESTS_DIR="./new-tests-snippets"

# The target test directory in your hamlet project
TARGET_TEST_DIR="./test/unit"

#############################################
# 2. Copy the new test files
#############################################

echo "Creating target test directory if needed: $TARGET_TEST_DIR"
mkdir -p "$TARGET_TEST_DIR"

echo "Copying new converter test files into $TARGET_TEST_DIR..."

# Adapt the exact file names below to match whatever you actually have:
cp "$NEW_TESTS_DIR/cypressToPlaywrightConverter.test.ts" "$TARGET_TEST_DIR/"
cp "$NEW_TESTS_DIR/cypressToTestRailConverter.test.ts" "$TARGET_TEST_DIR/"
cp "$NEW_TESTS_DIR/playwrightToCypressConverter.test.ts" "$TARGET_TEST_DIR/"
cp "$NEW_TESTS_DIR/playwrightToTestRailConverter.test.ts" "$TARGET_TEST_DIR/"
cp "$NEW_TESTS_DIR/testrailToCypressConverter.test.ts" "$TARGET_TEST_DIR/"
cp "$NEW_TESTS_DIR/testrailToPlaywrightConverter.test.ts" "$TARGET_TEST_DIR/"

echo "New converter test files copied successfully."

#############################################
# 3. Compile the project
#############################################

echo "Compiling the TypeScript project..."
npm run compile

#############################################
# 4. Run the tests
#############################################

echo "Running tests..."
npm test

#############################################
# 5. Done
#############################################

echo "All done! Your new tests should be active now."
