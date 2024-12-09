import React from 'react';
import { BarChart2, Clock, Hash, Zap, PieChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts';

interface SearchAnalytics {
  execution_time_ms: number;
  total_results: number;
  max_score: number;
  vector_query: boolean;
  result_distribution?: {
    content_type: string;
    count: number;
  }[];
  score_ranges?: {
    range: string;
    count: number;
  }[];
  timing_breakdown?: {
    phase: string;
    time_ms: number;
  }[];
}

interface Props {
  analytics: SearchAnalytics;
  className?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function SearchAnalytics({ analytics, className }: Props) {
  const scoreRanges = analytics.score_ranges || [
    { range: '90-100%', count: 2 },
    { range: '80-90%', count: 5 },
    { range: '70-80%', count: 8 },
    { range: '<70%', count: 3 }
  ];

  const timingData = analytics.timing_breakdown || [
    { phase: 'Query Parse', time_ms: 5 },
    { phase: 'Vector Search', time_ms: 15 },
    { phase: 'Text Search', time_ms: 12 },
    { phase: 'Ranking', time_ms: 8 }
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Time"
          value={`${analytics.execution_time_ms}ms`}
          description="Query execution time"
          icon={Clock}
        />
        <StatCard
          title="Results"
          value={analytics.total_results}
          description="Total matches found"
          icon={Hash}
        />
        <StatCard
          title="Top Score"
          value={`${(analytics.max_score * 100).toFixed(1)}%`}
          description="Highest match score"
          icon={BarChart2}
        />
        <StatCard
          title="Mode"
          value={analytics.vector_query ? 'Hybrid' : 'Text'}
          description={analytics.vector_query ? 'Vector + Text' : 'Text-only search'}
          icon={Zap}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreRanges}>
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Time Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timingData}
                    dataKey="time_ms"
                    nameKey="phase"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    label
                  >
                    {timingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}