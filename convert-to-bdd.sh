#!/bin/bash

# Create backup directory
backup_dir="test_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

# Function to convert a file to BDD style
convert_file() {
    local file="$1"
    echo "Converting $file to BDD style..."
    
    # Create backup
    cp "$file" "$backup_dir/$(basename "$file")"
    
    # Temporary file for processing
    temp_file=$(mktemp)
    
    # Update imports first
    sed -e 's/import { suite, test } from '\''mocha'\''/import { describe, it } from '\''mocha'\''/' \
        -e 's/import { suite } from '\''mocha'\''/import { describe } from '\''mocha'\''/' \
        -e 's/import { test } from '\''mocha'\''/import { it } from '\''mocha'\''/' \
        "$file" > "$temp_file"
    
    # Replace test patterns
    sed -i '' \
        -e 's/suite(\(['"'"'"]\)/describe(\1/g' \
        -e 's/test(\(['"'"'"]\)/it(\1/g' \
        -e 's/suite\.only(/describe.only(/g' \
        -e 's/test\.only(/it.only(/g' \
        -e 's/suite\.skip(/describe.skip(/g' \
        -e 's/test\.skip(/it.skip(/g' \
        "$temp_file"
    
    # Move processed file back
    mv "$temp_file" "$file"
}

echo "Starting conversion to BDD style..."
echo "Backup will be created in: $backup_dir"

# Process all test files
for file in src/test/suite/*.test.ts; do
    if [ -f "$file" ]; then
        convert_file "$file"
    fi
done

echo "Conversion complete. Backups stored in $backup_dir"
echo "Please review the changes and run your tests to verify everything works"