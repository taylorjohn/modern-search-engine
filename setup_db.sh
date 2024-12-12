#!/bin/bash
set -e

# Configuration
DB_NAME="modern_search"
DB_USER="$USER"
MIGRATIONS_DIR="migrations"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Setting up Modern Search Engine database..."

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
    echo "${RED}Error: PostgreSQL is not running${NC}"
    exit 1
fi

# Create database if it doesn't exist
if ! psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Creating database ${DB_NAME}..."
    createdb "$DB_NAME"
else
    echo "Database ${DB_NAME} already exists"
fi

# Create migrations directory if it doesn't exist
mkdir -p "$MIGRATIONS_DIR"

# Copy migration file
echo "Creating migration file..."
cat > "$MIGRATIONS_DIR/20240324000000_init_vector_support.sql" << 'EOL'
-- Migration content here (paste the entire SQL content from above)
EOL

# Run migration
echo "Running migration..."
psql -d "$DB_NAME" -f "$MIGRATIONS_DIR/20240324000000_init_vector_support.sql"

# Verify setup
echo "Verifying setup..."
psql -d "$DB_NAME" << EOF
    \dx vector
    \d documents
    \d processing_tasks
    \d search_history
EOF

echo "${GREEN}Database setup completed successfully!${NC}"

# Create .env file with database URL
echo "Creating .env file..."
cat > .env << EOF
DATABASE_URL=postgres://$DB_USER@localhost/$DB_NAME
RUST_LOG=debug
PORT=3030
HOST=127.0.0.1
VECTOR_DIMENSION=384
EOF

echo "${GREEN}Setup complete! Your database is ready to use.${NC}"
echo "You can now run: cargo build"