# Modern Search Engine V2

A high-performance search engine with transparent scoring, hybrid search capabilities, and real-time vector similarity matching.

## New Features in V2

### 1. Hybrid Search
- Combined text and vector similarity search
- Real-time scoring visualization
- Configurable weighting between text and semantic matching
- Query expansion and enhanced relevance

### 2. Transparent Scoring
- Detailed scoring breakdown for each result
- Visual representation of match factors
- Field-level relevance weights
- Score comparison across different search methods

### 3. Vector Search Improvements
- Real-time vector embedding generation
- Optimized vector storage and retrieval
- Configurable similarity thresholds
- Support for multiple vector models

### 4. Enhanced Document Processing
- Improved PDF text extraction
- HTML content cleaning and structuring
- Metadata extraction and indexing
- Async processing with progress tracking

### 5. Real-time Analytics
- Search performance metrics
- Query analysis
- Result distribution visualization
- Processing time breakdowns

## Technical Architecture

### Core Components
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client App    │────▶│ REST API Layer   │────▶│  Search Engine  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                ┌──────────────────────┬──┴─────────────────────┐
                                ▼                      ▼                        ▼
                        ┌──────────────┐      ┌──────────────┐        ┌──────────────┐
                        │ Vector Store │      │    Index     │        │   Document   │
                        └──────────────┘      └──────────────┘        │  Processor   │
                                                                      └──────────────┘
```

### Technology Stack
- **Backend**: Rust
  - Web Framework: Warp
  - Vector Search: Custom implementation with PostgreSQL
  - Text Search: Tantivy
  - Database: PostgreSQL with pgvector
- **Frontend**: React/TypeScript
  - UI Components: shadcn/ui
  - Visualization: Recharts
  - Styling: Tailwind CSS

## API Endpoints

### Search
```http
GET /api/search
```
Parameters:
- `q` (string): Search query
- `limit` (integer, optional): Maximum results (default: 10)
- `offset` (integer, optional): Pagination offset
- `use_vector` (boolean, optional): Enable vector search
- `weights` (object, optional): Field importance weights

Example Response:
```json
{
  "query": {
    "original": "machine learning",
    "expanded": "machine learning AI artificial intelligence",
    "vector_query": true
  },
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Introduction to Machine Learning",
      "content": "...",
      "scores": {
        "text_score": 0.85,
        "vector_score": 0.92,
        "final_score": 0.89
      },
      "highlights": ["Introduction to <em>Machine Learning</em>"],
      "metadata": {
        "source_type": "pdf",
        "author": "John Doe",
        "created_at": "2024-01-01T00:00:00Z"
      }
    }
  ],
  "analytics": {
    "execution_time_ms": 45,
    "total_results": 1,
    "max_score": 0.89
  }
}
```

### Document Upload
```http
POST /api/documents
```
Request Body:
```json
{
  "content": "string (base64 for PDF)",
  "title": "string",
  "content_type": "pdf|html|text",
  "metadata": {
    "author": "string",
    "tags": ["string"]
  }
}
```

### Processing Status
```http
GET /api/documents/status/{id}
```

## Setup

### Prerequisites
- Rust (1.70 or later)
- PostgreSQL (14 or later with pgvector extension)
- Node.js (18 or later)
- Docker (optional)

### Installation

1. Database Setup
```bash
# Create database
createdb search_engine

# Install pgvector
psql -d search_engine -c 'CREATE EXTENSION vector;'

# Run migrations
psql -d search_engine -f migrations/init.sql
```

2. Backend Setup
```bash
# Build project
cargo build --release

# Configure environment
cp .env.example .env

# Start server
cargo run --release
```

3. Frontend Setup
```bash
cd ui
npm install
npm run build
npm start
```

### Docker Setup
```bash
# Build and start services
docker-compose up -d

# Initialize database
docker-compose exec app ./scripts/setup.sh
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

# Vector Search
VECTOR_DIMENSION=384
VECTOR_SIMILARITY_THRESHOLD=0.7
VECTOR_WEIGHT=0.6
TEXT_WEIGHT=0.4

# Processing
MAX_DOCUMENT_SIZE=10485760
SUPPORTED_TYPES=pdf,html,txt
```

### Advanced Configuration
See `config/default.toml` for additional settings.

## Development

### Running Tests
```bash
# Run all tests
cargo test

# Run specific test suite
cargo test --test integration_tests
```

### Code Style
```bash
# Check formatting
cargo fmt --check

# Run clippy
cargo clippy
```

## Performance Considerations

- Configurable batch processing for large documents
- Optimized vector operations
- Caching layers for frequent queries
- Connection pooling for database operations

## Security

- Input sanitization
- Rate limiting
- API key authentication
- CORS configuration
- SQL injection prevention

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

Released under the MIT License. See [LICENSE](LICENSE) file for details.