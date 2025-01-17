export interface ProcessedDocument {
  id: string;
  content: string;
  metadata: {
    filename: string;
    words: number;
    type: string;
    created: Date;
  };
}

let processedDocuments: ProcessedDocument[] = [];

export const processFile = async (
  file: File, 
  onProgress: (progress: number) => void
): Promise<ProcessedDocument> => {
  return new Promise<ProcessedDocument>((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result?.toString() || '';
        
        // Simulate processing time with progress
        for (let i = 0; i <= 100; i += 10) {
          onProgress(i);
          await new Promise(r => setTimeout(r, 100));
        }

        const doc: ProcessedDocument = {
          id: Math.random().toString(36).substring(7),
          content,
          metadata: {
            filename: file.name,
            words: content.split(/\s+/).filter(Boolean).length,
            type: file.type || 'text/plain',
            created: new Date()
          }
        };

        processedDocuments.push(doc);
        resolve(doc);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.readAsText(file);
  });
};

export const searchDocuments = (query: string): ProcessedDocument[] => {
  if (!query?.trim()) return [];
  
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  return processedDocuments.filter(doc => 
    searchTerms.some(term => 
      doc.content.toLowerCase().includes(term) ||
      doc.metadata.filename.toLowerCase().includes(term)
    )
  );
};

export const getProcessedDocuments = (): ProcessedDocument[] => {
  return [...processedDocuments];
};

export const clearProcessedDocuments = (): void => {
  processedDocuments = [];
};