# Modern Search Engine API Documentation

## Overview
The Modern Search Engine provides a REST API for document search, processing, and management. This document outlines the available endpoints, their parameters, and example responses.

## Base URL
```
http://localhost:3030/api
```

## Authentication
All API requests require a valid API key passed in the `Authorization` header:
```
Authorization: Bearer your-api-key
```

## Endpoints

### Search
#### GET /search
Search for documents using text and vector similarity.

**Parameters:**
- `q` (string, required): Search query
- `limit` (integer, optional): Maximum number of results (default: 10)
- `offset` (integer, optional): Result offset for pagination (default: 0)
- `fields` (array, optional): Specific fields to search
- `use_vector` (boolean, optional): Enable vector similarity search (default: true)

**Example Request:**
```bash
curl -X GET "http://localhost:3030/api/search?q=machine+learning&limit=10" \
  -H "Authorization: Bearer your-api-key"
```

**Example Response:**
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
      "content": "Machine learning is a subset of artificial intelligence...",
      "scores": {
        "text_score": 0.85,
        "vector_score": 0.92,
        "final_score": 0.89
      },
      "highlights": [
        "Introduction to <em>Machine Learning</em>"
      ]
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
#### POST /documents
Upload and process a new document.

**Request Body:**
```json
{
  "type": "pdf|html|text",
  "content": "string (base64 for PDF)",
  "title": "string",
  "metadata": {
    "author": "string",
    "tags": ["string"]
  }
}
```

**Example Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "progress": 0,
  "message": "Document upload started"
}
```

### Processing Status
#### GET /documents/status/{id}
Get the processing status of a document.

**Example Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "progress": 100,
  "result": {
    "title": "Document Title",
    "content_type": "pdf",
    "word_count": 1500,
    "language": "en"
  }
}
```

## Error Responses
All errors follow this format:
```json
{
  "code": "ERROR_CODE",
  "message": "Error description",
  "details": {}
}
```

Common error codes:
- `INVALID_REQUEST`: Missing or invalid parameters
- `AUTH_ERROR`: Authentication failed
- `NOT_FOUND`: Resource not found
- `PROCESSING_ERROR`: Document processing failed
- `INTERNAL_ERROR`: Server error

## Rate Limiting
- 100 requests per minute per API key
- 1000 requests per hour per API key
- Status code 429 returned when exceeded

## Webhooks
Configure webhooks for processing status updates:
```json
POST /webhooks
{
  "url": "https://your-domain.com/webhook",
  "events": ["document.processed", "document.failed"]
}
```

## SDKs and Client Libraries
- [Python SDK](https://github.com/your-org/search-engine-python)
- [JavaScript SDK](https://github.com/your-org/search-engine-js)
- [Rust Client](https://github.com/your-org/search-engine-rust)