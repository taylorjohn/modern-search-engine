# Setup Guide

## Prerequisites
- Rust (1.70 or later)
- PostgreSQL (14 or later)
- Node.js (18 or later)
- Docker (optional)

## Installation

### Using Docker
```bash
# Build and start services
docker-compose up -d

# Initialize database
docker-compose exec app ./scripts/setup.sh
```

### Manual Setup

1. **Database Setup**
```bash
# Create database
createdb search_engine

# Run migrations
psql -d search_engine -f migrations/init.sql
```

2. **Backend Setup**
```bash
# Install dependencies
cargo build --release

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run the server
cargo run --release
```

3. **Frontend Setup**
```bash
cd ui
npm install
npm run build
```

## Configuration

### Environment Variables
```env
# Server
PORT=3030
HOST=127.0.0.1
RUST_LOG=info

# Database
DATABASE_URL=postgres://user:password@localhost/search_engine

# Vector Store
VECTOR_STORE_TYPE=postgres
VECTOR_DIMENSION=384

# Search
MAX_RESULTS=100
MIN_SCORE=0.1
VECTOR_WEIGHT=0.6
TEXT_WEIGHT=0.4

# Processing
MAX_DOCUMENT_SIZE=10485760
SUPPORTED_TYPES=pdf,html,txt
```

### Advanced Configuration

#### Vector Store
Choose between different vector store backends:
- PostgreSQL (with pgvector)
- Milvus
- FAISS

```toml
# config.toml
[vector_store]
type = "postgres"  # or "milvus", "faiss"
dimension = 384
index_type = "ivfflat"
index_params = { lists = 100 }
```

#### Search Configuration
```toml
[search]
max_results = 100
min_score = 0.1
vector_weight = 0.6
text_weight = 0.4
use_query_expansion = true
```

## Production Deployment

### Using Systemd
```bash
# Copy service file
sudo cp deployment/search-engine.service /etc/systemd/system/

# Start service
sudo systemctl enable search-engine
sudo systemctl start search-engine
```

### Using Docker
```bash
# Build production image
docker build -t search-engine:prod .

# Run container
docker run -d \
  --name search-engine \
  -p 3030:3030 \
  -v /path/to/data:/app/data \
  search-engine:prod
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name search.yourdomain.com;

    location / {
        proxy_pass http://localhost:3030;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring

### Prometheus Metrics
Available at `/metrics`:
- search_requests_total
- search_latency_seconds
- document_processing_duration_seconds
- vector_store_operations_total

### Logging
Logs are written to:
- stdout/stderr
- /var/log/search-engine/app.log
- Configurable through RUST_LOG

## Maintenance

### Database Backup
```bash
# Backup
./scripts/backup.sh

# Restore
./scripts/restore.sh backup_file.sql
```

### Index Optimization
```bash
# Optimize vector index
psql -d search_engine -c "VACUUM ANALYZE documents;"
```

## Troubleshooting

### Common Issues

1. **Slow Search Performance**
```sql
-- Check index usage
EXPLAIN ANALYZE SELECT * FROM documents WHERE ...
```

2. **High Memory Usage**
- Adjust `max_connections` in PostgreSQL
- Configure vector store cache size

3. **Processing Failures**
- Check logs: `tail -f /var/log/search-engine/app.log`
- Verify document size limits

## Support
- GitHub Issues: [link]
- Documentation: [link]
- Community Forum: [link]