#!/bin/bash

# Colors for better readability
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

# Function to print directory tree
print_tree() {
    local prefix="$1"
    local dir="$2"
    local first="$3"

    # List all files/directories except . and ..
    local items=($(ls -A "$dir"))

    # Count items
    local count=${#items[@]}

    for ((i=0; i<count; i++)); do
        local item="${items[$i]}"
        local path="$dir/$item"
        
        # Determine if this is the last item
        local islast=$([ $i -eq $((count-1)) ] && echo "1" || echo "0")
        
        # Print item
        if [ -d "$path" ]; then
            # Directory
            echo -e "${prefix}${islast:+└──}${islast:-├──} ${BLUE}${item}/${NC}"
            [ "$islast" = "1" ] && newprefix="$prefix    " || newprefix="$prefix│   "
            print_tree "$newprefix" "$path" "0"
        else
            # File
            if [[ "$item" == *.js || "$item" == *.ts || "$item" == *.jsx || "$item" == *.tsx ]]; then
                # JavaScript/TypeScript files in yellow
                echo -e "${prefix}${islast:+└──}${islast:-├──} ${YELLOW}${item}${NC}"
            else
                # Other files in green
                echo -e "${prefix}${islast:+└──}${islast:-├──} ${GREEN}${item}${NC}"
            fi
        fi
    done
}

# Main execution
echo -e "${BLUE}Project Directory Structure${NC}"
echo "."
print_tree "" "." "1"

