// src/components/search/ScoreBar.tsx
import React from 'react';

interface ScoreBarProps {
  label: string;
  score: number;
  color?: 'blue' | 'green';
}

export const ScoreBar: React.FC<ScoreBarProps> = ({ 
  label, 
  score, 
  color = 'blue' 
}) => {
  const percentage = (score * 100).toFixed(1);
  const barColor = color === 'blue' ? 'bg-blue-600' : 'bg-green-600';
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};