// src/services/fileProcessing.ts
export interface ProcessingResult {
  content?: string;
  processed: boolean;
  size?: number;
  type: string;
  name: string;
}

export async function processFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ProcessingResult> {
  // Default progress handler if none provided
  const handleProgress = onProgress || (() => {});

  return new Promise((resolve, reject) => {
    // Check for empty file
    if (file.size === 0) {
      handleProgress(100);
      resolve({
        content: '',
        processed: true,
        size: 0,
        type: file.type,
        name: file.name
      });
      return;
    }

    // Validate file type
    const supportedTypes = ['text/plain', 'application/pdf'];
    if (!supportedTypes.includes(file.type)) {
      reject(new Error('Unsupported file type'));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // Simulate processing delay with progress updates
        for (let progress = 0; progress <= 100; progress += 20) {
          handleProgress(progress);
          await new Promise(r => setTimeout(r, 50));
        }

        const result = e.target?.result;
        let content: string | undefined;
        
        if (typeof result === 'string') {
          content = result;
        }
        
        resolve({
          content,
          processed: true,
          size: file.size,
          type: file.type,
          name: file.name
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    if (file.type === 'application/pdf') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}