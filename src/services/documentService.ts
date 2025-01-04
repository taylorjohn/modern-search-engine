// src/services/documentService.ts
import { mockSearch, enhancedMockDocuments, type MockDocument } from '../mockData';

export interface ProcessingStatus {
  filename: string;
  status: 'processing' | 'complete' | 'error';
  progress?: number;
  error?: string;
}

interface ProcessingSubscriber {
  (updates: ProcessingStatus[]): void;
}

class DocumentService {
  private subscribers: ProcessingSubscriber[] = [];
  private processingDocuments: ProcessingStatus[] = [];
  private documents: MockDocument[] = [];

  async uploadDocument(file: File): Promise<void> {
    const processingStatus: ProcessingStatus = {
      filename: file.name,
      status: 'processing',
      progress: 0
    };

    this.processingDocuments.push(processingStatus);
    this.notifySubscribers();

    try {
      // Read file content
      const content = await this.readFileContent(file);
      
      // Create document with consistent structure
      const processedDocument: MockDocument = {
        id: Math.random().toString(36).substr(2, 9),
        title: file.name,
        content: content,
        documentType: this.getDocumentType(file.type),
        scores: {
          textScore: 0,
          vectorScore: 0,
          finalScore: 0
        },
        metadata: {
          author: 'User Upload',
          created: new Date().toISOString(),
          wordCount: content.split(/\s+/).length,
          type: this.getDocumentType(file.type)
        },
        tags: [this.getDocumentType(file.type), 'user-upload']
      };

      // Simulate processing with multiple steps
      await this.processDocument(processingStatus, processedDocument);

      // Add to documents array
      this.documents.push(processedDocument);
      
      // Update status
      processingStatus.status = 'complete';
      processingStatus.progress = 100;
      this.notifySubscribers();

      console.log('Document processed successfully:', processedDocument.title);

    } catch (error) {
      console.error('Error processing document:', error);
      processingStatus.status = 'error';
      processingStatus.error = error instanceof Error ? error.message : 'Unknown error';
      this.notifySubscribers();
    }

    // Remove from processing queue after delay
    setTimeout(() => {
      this.processingDocuments = this.processingDocuments.filter(
        doc => doc.filename !== file.name
      );
      this.notifySubscribers();
    }, 2000);
  }

  async searchDocuments(query: string): Promise<MockDocument[]> {
    if (!query.trim()) {
      return [];
    }

    // Combine mock documents with uploaded documents
    const allDocuments = [...enhancedMockDocuments, ...this.documents];
    
    // Filter documents based on query
    const matchingDocuments = allDocuments.filter(doc => {
      const searchableText = `${doc.title} ${doc.content}`.toLowerCase();
      return searchableText.includes(query.toLowerCase());
    });

    // Calculate scores for matching documents
    return matchingDocuments.map(doc => ({
      ...doc,
      scores: {
        ...doc.scores,
        textScore: this.calculateTextScore(doc, query),
        vectorScore: this.calculateVectorScore(),
        finalScore: Math.random() * 0.3 + 0.7 // Temporary scoring for demo
      }
    }));
  }

  subscribeToProcessing(callback: ProcessingSubscriber) {
    this.subscribers.push(callback);
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter(sub => sub !== callback);
      }
    };
  }

  // Helper methods
  private notifySubscribers() {
    this.subscribers.forEach(subscriber => subscriber([...this.processingDocuments]));
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private getDocumentType(mimeType: string): 'pdf' | 'html' | 'text' | 'markdown' | 'code' {
    const types: Record<string, 'pdf' | 'html' | 'text' | 'markdown' | 'code'> = {
      'text/plain': 'text',
      'text/html': 'html',
      'application/pdf': 'pdf',
      'text/markdown': 'markdown',
      'text/javascript': 'code',
      'text/typescript': 'code'
    };
    return types[mimeType] || 'text';
  }

  private async processDocument(status: ProcessingStatus, document: MockDocument) {
    const totalSteps = 5;
    const stepTime = 500;

    for (let step = 1; step <= totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, stepTime));
      
      status.progress = (step / totalSteps) * 100;
      this.notifySubscribers();

      // Simulate different processing stages
      switch (step) {
        case 1:
          document.scores.textScore = Math.random();
          break;
        case 2:
          document.scores.vectorScore = Math.random();
          break;
        case 3:
          document.scores.finalScore = (document.scores.textScore + document.scores.vectorScore) / 2;
          break;
        case 4:
          // Add extra metadata
          document.metadata.wordCount = document.content.split(/\s+/).length;
          break;
        case 5:
          // Finalize document
          document.tags.push(`processed`);
          break;
      }
    }
  }

  private calculateTextScore(doc: MockDocument, query: string): number {
    const docText = `${doc.title} ${doc.content}`.toLowerCase();
    const queryTerms = query.toLowerCase().split(/\s+/);
    const matches = queryTerms.filter(term => docText.includes(term));
    return matches.length / queryTerms.length;
  }

  private calculateVectorScore(): number {
    // Simplified vector similarity score for demo
    return Math.random() * 0.3 + 0.7;
  }
}

export const documentService = new DocumentService();