import React from 'react';

const createMockIcon = (name: string) => 
  function MockIcon(props: any) {
    return React.createElement('div', { 
      ...props, 
      'data-testid': `mock-${name}-icon` 
    });
  };

export const Search = createMockIcon('search');
export const ChevronDown = createMockIcon('chevron-down');
export const ChevronUp = createMockIcon('chevron-up');
export const BarChart2 = createMockIcon('chart');
export const Clock = createMockIcon('clock');
export const Hash = createMockIcon('hash');
export const Zap = createMockIcon('zap');
export const History = createMockIcon('history');
export const FileText = createMockIcon('file-text');
export const Code = createMockIcon('code');
export const Globe = createMockIcon('globe');
export const Upload = createMockIcon('upload');
export const X = createMockIcon('x');