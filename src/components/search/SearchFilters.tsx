import React from 'react';
import { Calendar, FileText, Filter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface SearchFilters {
  contentTypes: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  authors: string[];
}

interface Props {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export default function SearchFilters({ filters, onChange }: Props) {
  const contentTypeOptions = ['pdf', 'html', 'text'];
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Filter className="h-4 w-4" />
          {(filters.contentTypes.length < 3 || filters.authors.length > 0 || filters.dateRange.from || filters.dateRange.to) && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Search Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <h3 className="font-medium">Content Types</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {contentTypeOptions.map(type => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.contentTypes.includes(type)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...filters.contentTypes, type]
                            : filters.contentTypes.filter(t => t !== type);
                          onChange({ ...filters, contentTypes: newTypes });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <h3 className="font-medium">Date Range</h3>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm text-gray-600">From</label>
                    <Input
                      type="date"
                      value={filters.dateRange.from?.toISOString().split('T')[0] || ''}
                      onChange={(e) => {
                        onChange({
                          ...filters,
                          dateRange: {
                            ...filters.dateRange,
                            from: e.target.value ? new Date(e.target.value) : null
                          }
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">To</label>
                    <Input
                      type="date"
                      value={filters.dateRange.to?.toISOString().split('T')[0] || ''}
                      onChange={(e) => {
                        onChange({
                          ...filters,
                          dateRange: {
                            ...filters.dateRange,
                            to: e.target.value ? new Date(e.target.value) : null
                          }
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <h3 className="font-medium">Authors</h3>
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Add author..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        const value = input.value.trim();
                        if (value && !filters.authors.includes(value)) {
                          onChange({
                            ...filters,
                            authors: [...filters.authors, value]
                          });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filters.authors.map(author => (
                      <span
                        key={author}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {author}
                        <button
                          onClick={() => {
                            onChange({
                              ...filters,
                              authors: filters.authors.filter(a => a !== author)
                            });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}