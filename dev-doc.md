# Modern Search Engine V2

A modern search engine built in Rust focusing on transparency, performance, and enhanced search capabilities through hybrid text and vector similarity matching.

## Key Features

### Enhanced Search Experience

#### Transparent Scoring
- **Visual Score Breakdown**
  - Text matching score (keyword/phrase matching)
  - Semantic similarity score (vector matching)
  - Field-specific scores (title, content, metadata)
  - Overall combined score with customizable weights

#### Hybrid Search Capabilities
```json
{
  "scores": {
    "text_score": 0.85,       // Traditional text matching
    "vector_score": 0.92,     // Semantic similarity
    "field_scores": {
      "title": 0.95,          // Title relevance
      "content": 0.82,        // Content relevance
      "metadata": 0.78        // Metadata match
    },
    "final_score": 0.89       // Weighted combination
  }
}
```

#### Real-time Analytics
```json
{
  "analytics": {
    "execution_time_ms": 45,
    "component_times": {
      "text_search_ms": 15,
      "vector_search_ms": 25,
      "scoring_ms": 5
    },
    "matches": {
      "text_matches": ["machine learning", "AI"],
      "semantic_matches": ["artificial intelligence", "neural networks"]
    }
  }
}
```

### Search UI Components

#### Score Visualization
```tsx
<SearchResult>
  <ScoreBreakdown
    scores={{
      text: 0.85,
      vector: 0.92,
      final: 0.89
    }}
    weights={{
      text: 0.4,
      vector: 0.6
    }}
  />
  <MatchHighlights
    textMatches={["machine", "learning"]}
    semanticMatches={["AI", "neural networks"]}
  />
</SearchResult>
```

#### Real-time Processing Steps
```tsx
<ProcessingSteps>
  <Step name="Query Analysis" duration="5ms">
    Query expansion and preprocessing
  </Step>
  <Step name="Text Search" duration="15ms">
    Keyword and phrase matching
  </Step>
  <Step name="Vector Search" duration="25ms">
    Semantic similarity calculation
  </Step>
  <Step name="Score Combination" duration="5ms">
    Weight application and normalization
  </Step>
</ProcessingSteps>
```

## Implementation Details

### Search Process Flow
1. **Query Processing**
   ```rust
   pub async fn process_query(&self, query: &str) -> Result<ProcessedQuery> {
       let expanded = self.expand_query(query)?;
       let vector = self.generate_query_embedding(&expanded).await?;
       
       Ok(ProcessedQuery {
           original: query.to_string(),
           expanded,
           vector_embedding: vector,
       })
   }
   ```

2. **Hybrid Search**
   ```rust
   pub async fn hybrid_search(&self, query: ProcessedQuery) -> Result<SearchResults> {
       let (text_results, vector_results) = tokio::join!(
           self.text_search(&query.expanded),
           self.vector_search(&query.vector_embedding)
       );
       
       Ok(self.combine_results(text_results?, vector_results?))
   }
   ```

3. **Score Calculation**
   ```rust
   impl ScoreCalculator {
       pub fn calculate_final_score(&self, doc: &Document, query: &ProcessedQuery) -> Score {
           let text_score = self.calculate_text_score(doc, &query.expanded);
           let vector_score = self.calculate_vector_score(doc, &query.vector_embedding);
           
           Score {
               text_score,
               vector_score,
               final_score: self.combine_scores(text_score, vector_score),
           }
       }
   }
   ```

## API Usage

### Basic Search
```bash
curl -X GET "http://localhost:3030/api/search?q=machine+learning&use_vector=true" \
  -H "Authorization: Bearer your-api-key"
```

### Advanced Search with Weights
```bash
curl -X POST "http://localhost:3030/api/search" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "weights": {
      "text": 0.4,
      "vector": 0.6,
      "fields": {
        "title": 1.5,
        "content": 1.0,
        "metadata": 0.8
      }
    }
  }'
```

### Response Example
```json
{
  "query": {
    "original": "machine learning",
    "expanded": "machine learning AI neural networks",
    "analysis": {
      "identified_concepts": ["AI", "neural networks"],
      "disambiguation": {
        "machine": "computing context",
        "learning": "AI context"
      }
    }
  },
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Introduction to Machine Learning",
      "content": "Machine learning is a subset of artificial intelligence...",
      "scores": {
        "text_score": 0.85,
        "vector_score": 0.92,
        "field_scores": {
          "title": 0.95,
          "content": 0.82,
          "metadata": 0.78
        },
        "final_score": 0.89
      },
      "highlights": {
        "text": [
          "Introduction to <em>Machine Learning</em>"
        ],
        "semantic": [
          "artificial intelligence",
          "neural networks"
        ]
      },
      "explanations": [
        "Strong title match (0.95)",
        "High semantic similarity to 'AI' and 'neural networks'",
        "Multiple keyword matches in content"
      ]
    }
  ],
  "analytics": {
    "execution_time_ms": 45,
    "result_quality": {
      "diversity_score": 0.85,
      "relevance_distribution": [0.89, 0.82, 0.75],
      "coverage": {
        "text_matches": 0.9,
        "semantic_matches": 0.85
      }
    }
  }
}
```

## Configuration

Configuration for fine-tuning search behavior and scoring:

```toml
[search]
# Scoring weights
text_weight = 0.4
vector_weight = 0.6
title_boost = 1.5
content_boost = 1.0
metadata_boost = 0.8

# Thresholds
min_score = 0.1
min_text_score = 0.2
min_vector_score = 0.3

# Query processing
use_query_expansion = true
max_expansion_terms = 3
semantic_matching = true

[analytics]
track_component_times = true
explain_scores = true
track_match_details = true
```

## Development

For development and testing:

```bash
# Run with enhanced logging
RUST_LOG=debug cargo run

# Run tests with score analysis
cargo test --features "test-analytics"

# Benchmark search performance
cargo bench --bench search_benchmark
```

This enhanced version of the search engine prioritizes transparency and understanding of the search process, making it ideal for applications where search result explanation is important.