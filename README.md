# Advanced Search Engine

A Rust-based search engine with transparent scoring and real-time results visualization.

## Features

- Full-text search with Tantivy
- Real-time search results
- Transparent scoring visualization
- Processing steps timing
- Semantic analysis
- Query expansion
- Spell checking
- Modern web interface

## Tech Stack

- Backend:
  - Rust
  - Warp (Web framework)
  - Tantivy (Search engine)
  - Tokio (Async runtime)
- Frontend:
  - HTML5
  - CSS3
  - JavaScript

## Getting Started

### Prerequisites

- Rust (latest stable version)
- Cargo

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/search-engine.git
cd search-engine
```

2. Build the project:
```bash
cargo build
```

3. Run the server:
```bash
cargo run
```

4. Open your browser and navigate to the URL shown in the console (typically http://127.0.0.1:3030)

## Usage

1. Enter your search query in the search box
2. Results will appear in real-time
3. View processing steps and timing information
4. See scoring breakdown for each result

## Project Structure


```
modern-search-engine/
├── src/
│   ├── api/
│   │   ├── handlers.rs
│   │   ├── routes.rs
│   │   ├── error.rs
│   │   └── mod.rs
│   ├── document/
│   │   ├── processor.rs 
│   │   ├── store.rs
│   │   ├── types.rs
│   │   └── mod.rs
│   ├── search/
│   │   ├── engine.rs
│   │   ├── query_parser.rs
│   │   ├── executor.rs
│   │   ├── scoring.rs
│   │   ├── types.rs
│   │   └── mod.rs
│   ├── vector/
│   │   ├── store.rs
│   │   ├── embeddings.rs
│   │   ├── types.rs
│   │   └── mod.rs
│   ├── telemetry/
│   │   ├── metrics.rs
│   │   ├── tracing.rs
│   │   └── mod.rs
│   ├── config/
│   │   ├── settings.rs
│   │   └── mod.rs
│   └── utils/
│       ├── helpers.rs
│       └── mod.rs
├── ui/
│   ├── src/
│   │   ├── components/
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── SearchResults.tsx
│   │   │   │   └── SearchAnalytics.tsx 
│   │   │   ├── document/
│   │   │   │   ├── DocumentUpload.tsx
│   │   │   │   ├── ProcessingStatus.tsx
│   │   │   │   └── DocumentPreview.tsx
│   │   │   └── ui/
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       └── sheet.tsx
│   │   ├── pages/
│   │   │   ├── Search.tsx
│   │   │   └── Upload.tsx
│   │   ├── App.tsx
│   │   ├── types.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── migrations/
│   └── init.sql
├── docs/
│   ├── API.md
│   ├── SETUP.md
│   └── ARCHITECTURE.md
└── scripts/
    ├── setup.sh
    └── test.sh

```

# Daily Setup Guide for Modern Search Engine Development

## 1. Database Setup

### 1.1 Start PostgreSQL
```bash
# Start PostgreSQL if not running
brew services start postgresql
# OR on Linux
sudo systemctl start postgresql

# Verify PostgreSQL is running
pg_isready
```

### 1.2 Create Development Database and Extensions
```bash
# Connect to PostgreSQL
psql postgres

# Create database and required extensions
CREATE DATABASE modern_search;
\c modern_search

# Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.3 Run Migrations
```bash
# Run initial schema migration
psql -d modern_search -f migrations/init.sql
```

## 2. Environment Configuration

### 2.1 Create .env file
```bash
# Create/update .env file in project root
cat > .env << EOL
# Database
DATABASE_URL=postgres://localhost/modern_search
RUST_LOG=debug

# Server
PORT=3030
HOST=127.0.0.1

# Vector Store
VECTOR_DIMENSION=384
VECTOR_STORE_TYPE=postgres

# Search Settings
MAX_RESULTS=100
MIN_SCORE=0.1
VECTOR_WEIGHT=0.6
TEXT_WEIGHT=0.4

# Processing
MAX_DOCUMENT_SIZE=10485760
SUPPORTED_TYPES=pdf,html,txt
EOL
```

### 2.2 Load Environment
```bash
# Load environment variables
source .env
```

## 3. Development Dependencies

### 3.1 Install Rust Dependencies
```bash
# Update Rust toolchain
rustup update

# Add required components
rustup component add clippy rustfmt

# Clear cargo cache (if needed)
cargo clean

# Update dependencies
cargo update
```

### 3.2 Install Frontend Dependencies
```bash
# Navigate to UI directory
cd ui

# Install/update npm packages
npm install

# Return to project root
cd ..
```

## 4. Build and Run

### 4.1 Build Project
```bash
# Build in development mode
cargo build

# Or for release
cargo build --release
```

### 4.2 Run Tests
```bash
# Run all tests
cargo test

# Run specific test
cargo test test_name
```

### 4.3 Start Development Servers
```bash
# Terminal 1: Run backend server
cargo run

# Terminal 2: Run frontend development server
cd ui && npm run dev
```

## 5. Verify Setup

### 5.1 Check Services
```bash
# Check database connection
psql -d modern_search -c "SELECT version();"

# Check API server
curl http://localhost:3030/health

# Check vector extension
psql -d modern_search -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### 5.2 Check Frontend
Open http://localhost:5173 in your browser (or the port shown in npm output)

## 6. Common Issues and Solutions

### 6.1 Database Connection Issues
```bash
# Reset PostgreSQL if needed
brew services restart postgresql

# Check database logs
tail -f /usr/local/var/log/postgres.log
```

### 6.2 Port Conflicts
```bash
# Check ports in use
lsof -i :3030
lsof -i :5173

# Kill process using port if needed
kill -9 <PID>
```

### 6.3 Clean Rebuild
```bash
# Complete cleanup and rebuild
cargo clean
rm -rf target/
cargo build
```

## 7. Development Database Commands

### 7.1 Reset Database
```bash
dropdb modern_search
createdb modern_search
psql -d modern_search -f migrations/init.sql
```

### 7.2 Backup/Restore
```bash
# Backup
pg_dump modern_search > backup.sql

# Restore
psql modern_search < backup.sql
```

## 8. Development Tools

### 8.1 Code Formatting
```bash
# Format Rust code
cargo fmt

# Format frontend code
cd ui && npm run format
```

### 8.2 Linting
```bash
# Rust linting
cargo clippy

# Frontend linting
cd ui && npm run lint
```

## 9. Monitoring

### 9.1 View Logs
```bash
# Backend logs
RUST_LOG=debug cargo run

# Frontend logs
cd ui && npm run dev
```

### 9.2 Database Monitoring
```bash
# Monitor active queries
psql -d modern_search -c "SELECT * FROM pg_stat_activity;"
```

## Daily Development Checklist

1. [ ] Start PostgreSQL service
2. [ ] Verify database and extensions
3. [ ] Check/update environment variables
4. [ ] Pull latest changes
5. [ ] Update dependencies if needed
6. [ ] Build project
7. [ ] Run tests
8. [ ] Start development servers
9. [ ] Verify API health
10. [ ] Begin development

Remember to check the logs and monitoring tools regularly during development for any issues.
## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
