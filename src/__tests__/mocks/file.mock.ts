// src/__tests__/mocks/file.mock.ts
export class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(parts: any[], filename: string, properties?: any) {
    const file = new File(parts, filename, properties);
    this.name = file.name;
    this.size = file.size;
    this.type = file.type;
    this.lastModified = file.lastModified;
  }
}