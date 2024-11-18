import React from 'react';
import { Database, Hash, Zap } from 'lucide-react';

const VectorSearchResult = ({ result }) => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">{result.title}</h3>
          <div className="text-sm text-gray-600 mb-2">
            by {result.author} • {result.tags.join(", ")}
          </div>
        </div>
        <div className="text-2xl font-bold text-blue-500">
          {(result.scores.final * 100).toFixed(0)}
        </div>
      </div>

      <div className="mt-4">
        <div className="font-medium mb-2 flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Vector Similarity
        </div>
        <div className="space-y-2">
          <ScoreBar 
            score={result.scores.vector} 
            label="Semantic" 
            color="purple" 
          />
          <ScoreBar 
            score={result.scores.keyword} 
            label="Keyword" 
            color="blue" 
          />
          <ScoreBar 
            score={result.scores.final} 
            label="Combined" 
            color="green" 
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="font-medium mb-2 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Vector Space
        </div>
        <div className="text-sm text-gray-600">
          {result.content}
        </div>
      </div>

      <div className="mt-4">
        <div className="font-medium mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Matching Factors
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Semantic Similarity:</div>
          <div>{(result.scores.vector * 100).toFixed(1)}%</div>
          <div>Keyword Match:</div>
          <div>{(result.scores.keyword * 100).toFixed(1)}%</div>
          <div>Final Score:</div>
          <div>{(result.scores.final * 100).toFixed(1)}%</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const VectorSearchAnalytics = ({ analytics }) => (
  <Card className="mb-4">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Database className="w-5 h-5" />
        Vector Search Analytics
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600">Search Type</div>
          <div className="text-xl font-semibold capitalize">{analytics.searchType}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Results</div>
          <div className="text-xl font-semibold">{analytics.totalResults}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Vector Weight</div>
          <div className="text-xl font-semibold">{analytics.weights.vector * 100}%</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Keyword Weight</div>
          <div className="text-xl font-semibold">{analytics.weights.keyword * 100}%</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function VectorSearchDemo() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <VectorSearchAnalytics analytics={sampleData.analytics} />
      {sampleData.results.map((result, index) => (
        <VectorSearchResult key={index} result={result} />
      ))}
    </div>
  );
}
