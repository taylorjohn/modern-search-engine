// src/__tests__/mocks/ui-components.tsx
import React from 'react';

// Mock Card components
export const Card = ({ className, children, ...props }: any) => (
  <div className={`mock-card ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }: any) => (
  <div className={`mock-card-header ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: any) => (
  <h3 className={`mock-card-title ${className || ''}`} {...props}>
    {children}
  </h3>
);

export const CardContent = ({ className, children, ...props }: any) => (
  <div className={`mock-card-content ${className || ''}`} {...props}>
    {children}
  </div>
);

// Mock Button component
export const Button = ({ className, children, ...props }: any) => (
  <button className={`mock-button ${className || ''}`} {...props}>
    {children}
  </button>
);

// Mock Input component
export const Input = ({ className, ...props }: any) => (
  <input className={`mock-input ${className || ''}`} {...props} />
);