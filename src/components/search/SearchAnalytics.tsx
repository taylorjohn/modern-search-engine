import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsProps {
  stats: {
    title: string;
    value: string | number;
    icon: LucideIcon;
  }[];
}

export function Stats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
      {stats.map(({ title, value, icon: Icon }) => (
        <Card key={title} className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <p className="text-2xl font-bold">{value}</p>
              </div>
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}