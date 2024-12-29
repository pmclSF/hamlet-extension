#!/bin/bash

# Define source and destination directories
SOURCE_DIRS=("src/test/unit" "src/test/suite" "src/test-patterns")
DEST_DIR="src/test/suite"

# Ensure the destination directory exists
mkdir -p "$DEST_DIR"

echo "Moving test files to $DEST_DIR..."

# Move all test files (*.test.ts or *.test.js) to the suite directory
for dir in "${SOURCE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        find "$dir" -type f -name "*.test.ts" -exec mv {} "$DEST_DIR/" \;
        find "$dir" -type f -name "*.test.js" -exec mv {} "$DEST_DIR/" \;
        echo "Moved test files from $dir to $DEST_DIR"
    else
        echo "Directory $dir does not exist, skipping."
    fi
done

# Update runTest.ts file
RUN_TEST_FILE="src/test/runTest.ts"

if [ -f "$RUN_TEST_FILE" ]; then
    echo "Updating $RUN_TEST_FILE to reflect new test structure..."

    sed -i '' \
        -e "s|path.resolve(projectRoot, 'out/src/test/unit')|path.resolve(projectRoot, 'out/src/test/suite')|g" \
        -e "s|path.resolve(projectRoot, 'out/src/test/suite')|path.resolve(projectRoot, 'out/src/test/suite')|g" \
        "$RUN_TEST_FILE"

    echo "Updated $RUN_TEST_FILE to point to src/test/suite."
else
    echo "$RUN_TEST_FILE not found. Please verify the path."
fi

echo "Operation completed."
