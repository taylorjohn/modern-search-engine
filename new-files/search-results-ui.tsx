import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const SearchResults = () => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Mock data - replace with actual data from your search engine
  const searchData = {
    query: "example search",
    queryExpansion: {
      originalQuery: "example search",
      expandedQuery: "example search tutorial guide",
      expansionScore: 0.85
    },
    spellCheck: {
      corrections: [],
      confidence: 1.0
    },
    semanticAnalysis: {
      intent: "informational",
      topics: ["tutorials", "learning"],
      confidence: 0.92
    },
    trieResults: {
      matchCount: 5,
      exactMatches: 2,
      prefixMatches: 3
    },
    results: [
      {
        title: "Example Search Guide",
        snippet: "A comprehensive guide to search...",
        scores: {
          relevance: 0.95,
          semantic: 0.88,
          final: 0.92
        }
      }
    ]
  };

  const SectionHeader = ({ title, isExpanded, onClick }) => (
    <div 
      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
    </div>
  );

  const ScoreBar = ({ score }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-600 rounded-full h-2" 
        style={{ width: `${score * 100}%` }}
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Results for: "{searchData.query}"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Query Expansion Section */}
          <Card>
            <SectionHeader 
              title="Query Expansion" 
              isExpanded={expandedSections.expansion}
              onClick={() => toggleSection('expansion')}
            />
            {expandedSections.expansion && (
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>Original Query:</div>
                  <div>{searchData.queryExpansion.originalQuery}</div>
                  <div>Expanded Query:</div>
                  <div>{searchData.queryExpansion.expandedQuery}</div>
                  <div>Expansion Score:</div>
                  <div>
                    <ScoreBar score={searchData.queryExpansion.expansionScore} />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Spell Check Section */}
          <Card>
            <SectionHeader 
              title="Spell Check" 
              isExpanded={expandedSections.spellCheck}
              onClick={() => toggleSection('spellCheck')}
            />
            {expandedSections.spellCheck && (
              <CardContent className="space-y-2">
                <div>Confidence: <ScoreBar score={searchData.spellCheck.confidence} /></div>
                <div>
                  {searchData.spellCheck.corrections.length === 0 
                    ? "No corrections needed" 
                    : "Corrections: " + searchData.spellCheck.corrections.join(", ")}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Semantic Analysis Section */}
          <Card>
            <SectionHeader 
              title="Semantic Analysis" 
              isExpanded={expandedSections.semantic}
              onClick={() => toggleSection('semantic')}
            />
            {expandedSections.semantic && (
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>Intent:</div>
                  <div>{searchData.semanticAnalysis.intent}</div>
                  <div>Topics:</div>
                  <div>{searchData.semanticAnalysis.topics.join(", ")}</div>
                  <div>Confidence:</div>
                  <div>
                    <ScoreBar score={searchData.semanticAnalysis.confidence} />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Search Results */}
          <Card>
            <SectionHeader 
              title="Results" 
              isExpanded={expandedSections.results}
              onClick={() => toggleSection('results')}
            />
            {expandedSections.results && (
              <CardContent className="space-y-4">
                {searchData.results.map((result, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold">{result.title}</h4>
                    <p className="text-gray-600">{result.snippet}</p>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm">
                        Relevance Score: <ScoreBar score={result.scores.relevance} />
                      </div>
                      <div className="text-sm">
                        Semantic Score: <ScoreBar score={result.scores.semantic} />
                      </div>
                      <div className="text-sm">
                        Final Score: <ScoreBar score={result.scores.final} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchResults;
