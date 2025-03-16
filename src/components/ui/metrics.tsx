// src/components/ui/metrics.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  testId?: string;
}

export const MetricCard = ({ title, value, icon: Icon, testId }: MetricCardProps) => (
  <Card className="hover:shadow-lg transition-all duration-200">
    <CardContent className="p-6">
      <div className="flex justify-between items-start" data-testid={testId ? `metric-${testId}` : undefined}>
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold" data-testid="metric-value">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
    </CardContent>
  </Card>
);

interface ScoreBarProps {
  label: string;
  score: number;
  color?: string;
}

export const ScoreBar = ({ label, score, color = "bg-blue-600" }: ScoreBarProps) => (
  <div className="flex items-center gap-2">
    <span className="w-24 text-sm text-gray-600">{label}:</span>
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`${color} h-full transition-all duration-1000 ease-out`}
        style={{ width: `${score * 100}%` }}
        data-testid="score-bar-fill"
      />
    </div>
    <span className="w-16 text-sm text-gray-600 text-right">
      {(score * 100).toFixed(1)}%
    </span>
  </div>
);