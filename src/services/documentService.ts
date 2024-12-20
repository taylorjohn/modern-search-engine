// src/services/documentService.ts
import { MockDocument } from '../mockData';

interface VectorEntry {
  id: string;
  vector: number[];
  metadata: {
    title: string;
    content: string;
    fileName: string;
    type: string;
    created: string;
    size: number;
    headings: string[];
    description?: string;
    fileType: 'html' | 'pdf' | 'text' | 'markdown' | 'code';
  };
  // Store the original content for highlighting
  originalContent: string;
}

class DocumentService {
  private vectorStore: VectorEntry[] = [];

  private parseHTML(html: string): { 
    text: string; 
    title?: string; 
    headings: string[];
    description?: string;
  } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract title
    const title = doc.title || doc.querySelector('h1')?.textContent;

    // Extract meta description
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content');

    // Extract headings
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => h.textContent?.trim())
      .filter(Boolean) as string[];

    // Extract text content, excluding scripts and styles
    const scripts = doc.querySelectorAll('script, style');
    scripts.forEach(s => s.remove());
    const text = doc.body.textContent?.trim() || '';

    return { text, title, headings, description };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private textToVector(text: string): number[] {
    // For demo, create a simple vector based on character frequencies
    const vector = new Array(128).fill(0);
    for (let char of text) {
      const code = char.charCodeAt(0);
      if (code < 128) {
        vector[code]++;
      }
    }
    const sum = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
    return vector.map(val => val / (sum || 1));
  }

  private findBestSnippet(content: string, query: string, snippetLength: number = 200): string {
    const words = content.split(/\s+/);
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    let bestScore = 0;
    let bestStart = 0;

    for (let i = 0; i < words.length - snippetLength; i++) {
      let score = 0;
      for (let j = 0; j < snippetLength; j++) {
        if (queryWords.has(words[i + j].toLowerCase())) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestStart = i;
      }
    }

    const snippet = words.slice(bestStart, bestStart + snippetLength).join(' ');
    return snippet + (bestStart + snippetLength < words.length ? '...' : '');
  }

  async processDocument(file: File): Promise<VectorEntry> {
    const content = await file.text();
    let processedContent: string;
    let title: string = file.name;
    let headings: string[] = [];
    let description: string | undefined;
    let fileType: VectorEntry['metadata']['fileType'] = 'text';

    // Process based on file type
    if (file.type === 'text/html') {
      const parsed = this.parseHTML(content);
      processedContent = parsed.text;
      if (parsed.title) title = parsed.title;
      headings = parsed.headings;
      description = parsed.description;
      fileType = 'html';
    } else {
      processedContent = content;
      fileType = 'text';
    }

    const vector = this.textToVector(processedContent);

    const entry: VectorEntry = {
      id: Math.random().toString(36).substring(7),
      vector,
      metadata: {
        title,
        content: processedContent.slice(0, 200) + '...',
        fileName: file.name,
        type: file.type,
        created: new Date().toISOString(),
        size: file.size,
        headings,
        description,
        fileType
      },
      originalContent: content
    };

    this.vectorStore.push(entry);
    return entry;
  }

  async searchDocuments(query: string): Promise<MockDocument[]> {
    const queryVector = this.textToVector(query);
    
    const results = this.vectorStore
      .map(entry => {
        const similarity = this.cosineSimilarity(queryVector, entry.vector);
        const bestSnippet = this.findBestSnippet(entry.metadata.content, query);

        return {
          id: entry.id,
          title: entry.metadata.title,
          content: bestSnippet,
          documentType: entry.metadata.fileType,
          scores: {
            textScore: Math.random() * 0.5 + 0.5,
            vectorScore: similarity,
            finalScore: similarity
          },
          metadata: {
            author: 'System',
            created: entry.metadata.created,
            wordCount: entry.metadata.content.split(/\s+/).length,
            type: entry.metadata.type,
            fileSize: entry.metadata.size,
            language: entry.metadata.fileType === 'html' ? 'HTML' : 'Text'
          },
          tags: [
            entry.metadata.fileType,
            ...entry.metadata.headings.slice(0, 3)
          ]
        };
      })
      .sort((a, b) => b.scores.finalScore - a.scores.finalScore);

    return results;
  }

  getDocuments(): VectorEntry[] {
    return this.vectorStore;
  }

  clearStore(): void {
    this.vectorStore = [];
  }
}

export const documentService = new DocumentService();