// src/services/analytics.ts
import type { SearchHistoryItem, SearchStats } from '../types/search';

export class AnalyticsService {
  private searchHistory: SearchHistoryItem[] = [];
  private readonly MAX_HISTORY_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  private calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private getCommonFilters(): string[] {
    const filterCounts = new Map<string, number>();
    
    this.searchHistory.forEach(item => {
      item.filters.contentTypes.forEach(type => {
        filterCounts.set(type, (filterCounts.get(type) || 0) + 1);
      });
      item.filters.authors.forEach(author => {
        filterCounts.set(author, (filterCounts.get(author) || 0) + 1);
      });
    });

    return Array.from(filterCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([filter]) => filter);
  }

  private analyzeUsageTimes(): Array<{ hour: number; count: number }> {
    const hourCounts = new Array(24).fill(0);
    
    this.searchHistory.forEach(item => {
      const hour = new Date(item.timestamp).getHours();
      hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({ hour, count }));
  }

  private analyzeDocumentTypes(): Array<{ type: string; count: number }> {
    const typeCounts = new Map<string, number>();
    
    this.searchHistory.forEach(item => {
      item.filters.contentTypes.forEach(type => {
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });
    });

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private analyzeAuthors(): Array<{ author: string; count: number }> {
    const authorCounts = new Map<string, number>();
    
    this.searchHistory.forEach(item => {
      item.filters.authors.forEach(author => {
        authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
      });
    });

    return Array.from(authorCounts.entries())
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private analyzeScoresByType(): Array<{ type: string; averageScore: number }> {
    const scoresByType = new Map<string, number[]>();
    
    this.searchHistory.forEach(item => {
      item.filters.contentTypes.forEach(type => {
        const scores = scoresByType.get(type) || [];
        // Assuming we track scores in history items
        scores.push(item.results);
        scoresByType.set(type, scores);
      });
    });

    return Array.from(scoresByType.entries())
      .map(([type, scores]) => ({
        type,
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  }

  private pruneOldData(): void {
    const cutoffTime = Date.now() - this.MAX_HISTORY_AGE;
    this.searchHistory = this.searchHistory.filter(item => item.timestamp > cutoffTime);
  }

  // Export analytics data
  public exportAnalytics(): string {
    const data = {
      searchHistory: this.searchHistory,
      stats: this.getSearchStats(),
      performance: this.getPerformanceMetrics(),
      userBehavior: this.getUserBehaviorInsights(),
      contentInsights: this.getContentInsights()
    };
    return JSON.stringify(data, null, 2);
  }

  // Import analytics data
  public importAnalytics(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data.searchHistory)) {
        this.searchHistory = data.searchHistory;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const analyticsService = new AnalyticsService();