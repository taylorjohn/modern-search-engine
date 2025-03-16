// src/services/searchService.ts
interface Document {
  id: string;
  title: string;
  content: string;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  highlight?: {
    title?: string[];
    content?: string[];
  };
}

export class SearchService {
  private documents: Document[] = [];
  
  // Parse the raw text into structured documents
  parseDocuments(text: string): Document[] {
    const documents: Document[] = [];
    const documentBlocks = text.split('DOC_ID:').filter(block => block.trim());

    documentBlocks.forEach(block => {
      const idMatch = block.match(/(\d+)/);
      const titleMatch = block.match(/TITLE:\s*(.*?)\s*\n/);
      const contentMatch = block.match(/CONTENT:\s*(.*?)(?=\n|$)/);

      if (idMatch && titleMatch && contentMatch) {
        documents.push({
          id: idMatch[1],
          title: titleMatch[1].trim(),
          content: contentMatch[1].trim()
        });
      }
    });

    this.documents = documents;
    return documents;
  }

  // Search through documents
  search(query: string): SearchResult[] {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(/\s+/);
    
    return this.documents
      .map(doc => {
        const titleScore = this.calculateScore(doc.title.toLowerCase(), searchTerms);
        const contentScore = this.calculateScore(doc.content.toLowerCase(), searchTerms);
        const score = (titleScore * 2 + contentScore) / 3; // Title matches weighted more heavily

        return {
          ...doc,
          score,
          highlight: {
            title: this.getHighlights(doc.title, searchTerms),
            content: this.getHighlights(doc.content, searchTerms)
          }
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  private calculateScore(text: string, terms: string[]): number {
    const matches = terms.filter(term => text.includes(term));
    return matches.length / terms.length;
  }

  private getHighlights(text: string, terms: string[]): string[] {
    const lowerText = text.toLowerCase();
    const matches: string[] = [];

    terms.forEach(term => {
      const index = lowerText.indexOf(term);
      if (index >= 0) {
        const start = Math.max(0, index - 20);
        const end = Math.min(text.length, index + term.length + 20);
        let highlight = text.slice(start, end);
        
        if (start > 0) highlight = '...' + highlight;
        if (end < text.length) highlight = highlight + '...';
        
        matches.push(highlight);
      }
    });

    return matches;
  }
}

export const searchService = new SearchService();