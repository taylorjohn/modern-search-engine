#!/bin/bash
set -e

echo "Starting Modern Search Engine setup..."

# Check PostgreSQL
check_postgres() {
    echo "Checking PostgreSQL installation..."
    if ! command -v psql > /dev/null; then
        echo "Error: PostgreSQL is not installed. Please install PostgreSQL first."
        exit 1
    fi
    echo "✓ PostgreSQL found"
}

# Check if postgres is running
check_postgres_running() {
    echo "Checking if PostgreSQL server is running..."
    if ! pg_isready > /dev/null 2>&1; then
        echo "Error: PostgreSQL server is not running. Please start PostgreSQL first."
        exit 1
    fi
    echo "✓ PostgreSQL server is running"
}

# Check pgvector
check_pgvector() {
    echo "Checking pgvector installation..."
    if ! brew list pgvector &>/dev/null; then
        echo "Installing pgvector..."
        brew install pgvector
    fi
    echo "✓ pgvector found"
}

# Database configuration
DB_NAME="modern_search"
DB_USER=${PGUSER:-$USER}
DB_HOST=${PGHOST:-"localhost"}
DB_PORT=${PGPORT:-5432}

# Perform setup
setup_database() {
    echo "Setting up database..."

    # Drop existing database if --force flag is used
    if [ "$1" == "--force" ] && psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo "Dropping existing database..."
        dropdb "$DB_NAME"
    fi

    # Create database if it doesn't exist
    if ! psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo "Creating database $DB_NAME..."
        createdb "$DB_NAME"
        echo "✓ Database created"
    else
        echo "✓ Database already exists"
    fi

    # Run migrations
    echo "Running migrations..."
    psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -f migrations/20240323000000_init.sql
    echo "✓ Migrations completed"
}

# Main execution
echo "Using database configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

check_postgres
check_postgres_running
check_pgvector
setup_database "$@"

echo ""
echo "Setup completed successfully!"
echo "Connection string: postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"