import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FilePdf, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface DocumentInfo {
  filename: string;
  content: string;
  wordCount: number;
  type: 'pdf' | 'txt';
}

const SearchResultComparison: React.FC<{docs: DocumentInfo[]}> = ({ docs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasDiscrepancy = docs.some(doc => 
    doc.wordCount !== docs[0].wordCount
  );

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <h3 className="font-medium">Similar Content Detected</h3>
        </div>

        {docs.map((doc, index) => (
          <div key={doc.filename} className="mb-4 last:mb-0">
            <div className="flex items-center gap-3 mb-2">
              {doc.type === 'pdf' ? (
                <FilePdf className="h-5 w-5 text-red-500" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500" />
              )}
              <div>
                <h4 className="font-medium">{doc.filename}</h4>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="uppercase">{doc.type}</span>
                  <span>•</span>
                  <span>{doc.wordCount} words</span>
                </div>
              </div>
            </div>

            <div className="pl-8">
              <p className="text-gray-700">
                {doc.content.substring(0, isExpanded ? undefined : 150)}
                {!isExpanded && doc.content.length > 150 && '...'}
              </p>
            </div>
          </div>
        ))}

        {hasDiscrepancy && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">
              ⚠️ Note: These documents appear to have similar content but different word counts. 
              This might be due to different file formats or parsing methods.
            </p>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-sm text-blue-600 flex items-center gap-1 hover:text-blue-800"
        >
          {isExpanded ? (
            <>Show Less <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Show More <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      </CardContent>
    </Card>
  );
};

export default SearchResultComparison;