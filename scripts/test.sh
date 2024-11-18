#!/bin/bash
set -e

echo "Running Modern Search Engine tests..."

# Configuration
TEST_DB_NAME="search_engine_test"
export RUST_BACKTRACE=1
export RUST_LOG=debug

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Setup test database
setup_test_db() {
    echo "Setting up test database..."
    
    # Drop existing test database if it exists
    dropdb --if-exists "$TEST_DB_NAME"
    
    # Create fresh test database
    createdb "$TEST_DB_NAME"
    
    # Run migrations
    psql -d "$TEST_DB_NAME" -f migrations/init.sql
    
    # Set test database URL
    export DATABASE_URL="postgres://localhost/$TEST_DB_NAME"
}

# Run unit tests
run_unit_tests() {
    echo -e "${YELLOW}Running unit tests...${NC}"
    
    cargo test --lib -- --nocapture || {
        echo -e "${RED}Unit tests failed${NC}"
        return 1
    }
    
    echo -e "${GREEN}Unit tests passed${NC}"
}

# Run integration tests
run_integration_tests() {
    echo -e "${YELLOW}Running integration tests...${NC}"
    
    cargo test --test '*' -- --nocapture || {
        echo -e "${RED}Integration tests failed${NC}"
        return 1
    }
    
    echo -e "${GREEN}Integration tests passed${NC}"
}

# Run API tests
run_api_tests() {
    echo -e "${YELLOW}Running API tests...${NC}"
    
    # Start test server
    cargo run &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 2
    
    # Run API tests
    cargo test --test api_tests -- --nocapture || {
        echo -e "${RED}API tests failed${NC}"
        kill $SERVER_PID
        return 1
    }
    
    # Cleanup
    kill $SERVER_PID
    
    echo -e "${GREEN}API tests passed${NC}"
}

# Run frontend tests
run_frontend_tests() {
    echo -e "${YELLOW}Running frontend tests...${NC}"
    
    cd ui
    
    # Run tests
    npm test || {
        echo -e "${RED}Frontend tests failed${NC}"
        return 1
    }
    
    # Run linting
    npm run lint || {
        echo -e "${RED}Frontend linting failed${NC}"
        return 1
    }
    
    cd ..
    
    echo -e "${GREEN}Frontend tests passed${NC}"
}

# Run performance tests
run_performance_tests() {
    echo -e "${YELLOW}Running performance tests...${NC}"
    
    # Start server in test mode
    cargo run --release &
    SERVER_PID=$!
    
    sleep 2
    
    # Run performance tests
    cargo test --test performance -- --nocapture || {
        echo -e "${RED}Performance tests failed${NC}"
        kill $SERVER_PID
        return 1
    }
    
    # Cleanup
    kill $SERVER_PID
    
    echo -e "${GREEN}Performance tests passed${NC}"
}

# Generate test coverage report
generate_coverage() {
    echo "Generating test coverage report..."
    
    # Install cargo-tarpaulin if not present
    command -v cargo-tarpaulin >/dev/null 2>&1 || {
        cargo install cargo-tarpaulin
    }
    
    # Run coverage analysis
    cargo tarpaulin --out Html
}

# Cleanup test artifacts
cleanup() {
    echo "Cleaning up test artifacts..."
    
    # Drop test database
    dropdb --if-exists "$TEST_DB_NAME"
    
    # Remove temporary files
    rm -rf target/debug/deps/test_*
    rm -rf coverage/
}

# Main test execution
main() {
    # Trap cleanup
    trap cleanup EXIT
    
    # Setup test environment
    setup_test_db
    
    # Run tests
    run_unit_tests && \
    run_integration_tests && \
    run_api_tests && \
    run_frontend_tests && \
    run_performance_tests
    
    # Generate coverage if requested
    if [ "$1" == "--coverage" ]; then
        generate_coverage
    fi
    
    echo -e "${GREEN}All tests completed successfully!${NC}"
}

main "$@"