// src/components/ui/metrics.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  testId?: string;
  description?: string;
}

export function MetricCard({ title, value, icon: Icon, testId, description }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <Card 
      data-testid={testId || `metric-${title.toLowerCase()}`}
      className="relative"
      onMouseEnter={() => description && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm text-gray-600">{title}</div>
          </div>
          <div className="font-bold text-lg">{value}</div>
        </div>
        
        {/* Descriptive tooltip */}
        {showTooltip && description && (
          <div className="absolute -bottom-12 left-0 right-0 bg-gray-800 text-white text-xs p-2 rounded z-10 shadow-lg">
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ScoreBarProps {
  label: string;
  score: number;
  color?: string;
}

export function ScoreBar({ label, score, color = "bg-blue-500" }: ScoreBarProps) {
  const percentage = Math.max(0, Math.min(100, score * 100));
  
  return (
    <div className="w-full" data-testid={`score-bar-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}