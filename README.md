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
search-engine/
├── src/
│   ├── main.rs               # Server setup and sample data
│   ├── search_handler.rs     # Search request handling
│   ├── search_result.rs      # Result types and structures
│   ├── data_layer.rs         # Data storage abstraction
│   ├── semantic_analysis.rs  # Semantic analysis implementation
│   ├── query_expander.rs     # Query expansion logic
│   ├── spell_checker.rs      # Spell checking implementation
│   ├── trie.rs              # Trie data structure
│   └── scoring.rs            # Scoring calculations
└── static/
    └── index.html            # Web interface
```

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
