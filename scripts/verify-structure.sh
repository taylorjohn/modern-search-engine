#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check file existence
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Found $file ($description)"
        return 0
    else
        echo -e "${RED}✗${NC} Missing $file ($description)"
        return 1
    fi
}

# Function to check directory existence
check_directory() {
    local dir="$1"
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} Found directory $dir"
        return 0
    else
        echo -e "${RED}✗${NC} Missing directory $dir"
        return 1
    fi
}

# Main verification function
verify_structure() {
    echo -e "${YELLOW}Verifying project structure...${NC}\n"
    
    local missing_files=0
    local missing_dirs=0
    
    # Check main directories first
    echo "Checking directories..."
    while IFS= read -r dir; do
        if ! check_directory "$dir"; then
            ((missing_dirs++))
        fi
    done << EOL
./src
./ui
./tests
./docs
./scripts
./migrations
EOL
    
    echo -e "\nChecking files..."
    # Check all required files
    while IFS="|" read -r file description; do
        if ! check_file "$file" "$description"; then
            ((missing_files++))
        fi
    done << EOL
./Cargo.toml|Rust project configuration
./src/main.rs|Main entry point
./src/lib.rs|Library entry point
./src/api/mod.rs|API module definition
./src/api/routes.rs|API routes
./src/api/handlers.rs|API handlers
./src/api/error.rs|API error handling
./src/search/mod.rs|Search module definition
./src/search/engine.rs|Search engine implementation
./src/search/query_parser.rs|Query parsing
./src/search/executor.rs|Search execution
./src/search/scoring.rs|Search scoring
./src/document/mod.rs|Document module definition
./src/document/processor.rs|Document processor
./src/document/ingestion.rs|Document ingestion
./src/document/store.rs|Document storage
./src/vector/mod.rs|Vector module definition
./src/vector/store.rs|Vector storage
./src/vector/embeddings.rs|Vector embeddings
./src/config/mod.rs|Config module definition
./src/config/settings.rs|Configuration settings
./src/telemetry/mod.rs|Telemetry module definition
./src/telemetry/metrics.rs|Metrics collection
./src/telemetry/tracing.rs|Tracing setup
./src/utils/mod.rs|Utils module definition
./src/utils/helpers.rs|Helper functions
./ui/package.json|UI package configuration
./ui/tailwind.config.js|Tailwind configuration
./ui/tsconfig.json|TypeScript configuration
./ui/src/main.tsx|UI entry point
./ui/src/App.tsx|Main UI component
./ui/src/types.ts|TypeScript definitions
./ui/src/styles/globals.css|Global styles
./ui/src/components/ui/button.tsx|Button component
./ui/src/components/ui/card.tsx|Card component
./ui/src/components/ui/input.tsx|Input component
./ui/src/components/ui/sheet.tsx|Sheet component
./ui/src/components/search/SearchBar.tsx|Search bar component
./ui/src/components/search/SearchResults.tsx|Search results component
./ui/src/components/search/SearchAnalytics.tsx|Search analytics component
./ui/src/components/document/DocumentUpload.tsx|Document upload component
./ui/src/components/document/ProcessingStatus.tsx|Processing status component
./ui/src/components/document/DocumentPreview.tsx|Document preview component
./ui/src/pages/Search.tsx|Search page
./ui/src/pages/Upload.tsx|Upload page
./tests/api_tests.rs|API tests
./tests/search_tests.rs|Search tests
./tests/document_tests.rs|Document tests
./tests/integration_tests.rs|Integration tests
./migrations/init.sql|Database initialization
./docs/API.md|API documentation
./docs/SETUP.md|Setup documentation
./docs/ARCHITECTURE.md|Architecture documentation
./scripts/setup.sh|Setup script
./scripts/test.sh|Test script
EOL
    
    # Print summary
    echo -e "\nVerification Summary:"
    if [ $missing_files -eq 0 ] && [ $missing_dirs -eq 0 ]; then
        echo -e "${GREEN}All files and directories are present!${NC}"
    else
        echo -e "${RED}Missing files: $missing_files${NC}"
        echo -e "${RED}Missing directories: $missing_dirs${NC}"
        
        # Suggest next steps
        echo -e "\n${YELLOW}Suggested actions:${NC}"
        echo "1. Create missing directories first"
        echo "2. Create missing files following the project structure"
        echo "3. Run this verification script again"
        
        # Return error code
        exit 1
    fi
}

# Execute verification
verify_structure