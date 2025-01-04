// src/__tests__/mocks/react-dropzone.ts
import { vi } from 'vitest';

vi.mock('react-dropzone', () => {
  return {
    useDropzone: vi.fn((options) => {
      const {
        onDrop,
        accept,
        maxSize,
        multiple,
        disabled
      } = options;

      return {
        getRootProps: () => ({
          onClick: !disabled ? vi.fn() : undefined,
          onDrop: !disabled ? onDrop : undefined,
          onDragEnter: vi.fn(),
          onDragLeave: vi.fn(),
          'data-testid': 'dropzone',
          className: `
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `
        }),
        getInputProps: () => ({
          type: 'file',
          accept,
          multiple,
          disabled,
          onChange: (e: any) => {
            if (e.target.files && !disabled) {
              const files = Array.from(e.target.files);
              const acceptedFiles = accept
                ? files.filter(file => {
                    const fileType = file.type;
                    return Object.values(accept).some(types => 
                      types.some(type => fileType.match(type))
                    );
                  })
                : files;

              const rejectedFiles = files.filter(file => !acceptedFiles.includes(file));
              if (rejectedFiles.length === 0) {
                onDrop(acceptedFiles, rejectedFiles, e);
              }
            }
          }
        }),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        open: vi.fn(),
        acceptedFiles: [],
        fileRejections: [],
        isFileDialogActive: false
      };
    })
  };
});