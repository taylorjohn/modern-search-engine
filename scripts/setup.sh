#!/bin/bash
set -e

echo "Starting Modern Search Engine setup..."

# Check required tools
check_requirements() {
    echo "Checking system requirements..."
    
    command -v psql >/dev/null 2>&1 || { echo "PostgreSQL client is required but not installed. Aborting." >&2; exit 1; }
    command -v cargo >/dev/null 2>&1 || { echo "Rust/Cargo is required but not installed. Aborting." >&2; exit 1; }
    command -v npm >/dev/null 2>&1 || { echo "Node.js/npm is required but not installed. Aborting." >&2; exit 1; }
}

# Setup database
setup_database() {
    echo "Setting up database..."
    
    if [ -z "$DATABASE_URL" ]; then
        echo "DATABASE_URL environment variable not set. Using default configuration..."
        export DATABASE_URL="postgres://localhost/search_engine"
    fi

    # Create database if it doesn't exist
    psql -lqt | cut -d \| -f 1 | grep -qw search_engine || {
        echo "Creating database..."
        createdb search_engine
    }

    # Run migrations
    echo "Running database migrations..."
    psql -d search_engine -f migrations/init.sql

    # Install vector extension
    echo "Installing vector extension..."
    psql -d search_engine -c 'CREATE EXTENSION IF NOT EXISTS vector;'
}

# Setup Rust backend
setup_backend() {
    echo "Setting up backend..."
    
    # Build release
    cargo build --release

    # Create config directory if it doesn't exist
    mkdir -p config

    # Create default config if it doesn't exist
    if [ ! -f config/default.toml ]; then
        cat > config/default.toml << EOL
[server]
host = "127.0.0.1"
port = 3030

[database]
url = "${DATABASE_URL}"

[vector_store]
dimension = 384
index_type = "ivfflat"

[search]
max_results = 100
min_score = 0.1
vector_weight = 0.6
text_weight = 0.4

[processing]
max_document_size = 10485760
supported_types = ["pdf", "html", "txt"]
EOL
    fi
}

# Setup frontend
setup_frontend() {
    echo "Setting up frontend..."
    
    cd ui

    # Install dependencies
    npm install

    # Build production version
    npm run build

    cd ..
}

# Setup monitoring
setup_monitoring() {
    echo "Setting up monitoring..."

    # Create logging directory
    mkdir -p /var/log/search-engine
    
    # Setup Prometheus config if available
    if command -v prometheus >/dev/null 2>&1; then
        cat > /etc/prometheus/conf.d/search-engine.yml << EOL
- job_name: 'search-engine'
  static_configs:
    - targets: ['localhost:3030']
  metrics_path: '/metrics'
EOL
    fi
}

# Create systemd service
create_service() {
    echo "Creating systemd service..."
    
    cat > /etc/systemd/system/search-engine.service << EOL
[Unit]
Description=Modern Search Engine
After=network.target postgresql.service

[Service]
Type=simple
User=search-engine
Environment=RUST_LOG=info
Environment=CONFIG_PATH=/etc/search-engine/config
WorkingDirectory=/opt/search-engine
ExecStart=/opt/search-engine/target/release/modern-search-engine
Restart=always

[Install]
WantedBy=multi-user.target
EOL

    # Reload systemd
    systemctl daemon-reload
}

# Main setup
main() {
    check_requirements
    
    # Create directories
    mkdir -p {logs,data,config}

    # Run setup steps
    setup_database
    setup_backend
    setup_frontend
    setup_monitoring
    create_service

    echo "Setup completed successfully!"
    echo "You can now start the service with: systemctl start search-engine"
}

main "$@"