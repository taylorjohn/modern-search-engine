// src/types/dropzone.d.ts
declare module 'react-dropzone' {
  export interface DropzoneProps {
    onDrop?: (acceptedFiles: File[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    multiple?: boolean;
    disabled?: boolean;
  }

  export interface DropzoneState {
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFileDialogActive: boolean;
  }
}