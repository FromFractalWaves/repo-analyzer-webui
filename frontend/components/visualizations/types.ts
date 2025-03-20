// components/visualizations/types.ts
import { ReactNode } from 'react';
import { AnalysisData } from '@/types';

/**
 * Common props for all visualization components
 */
export interface VisualizationProps {
  data: AnalysisData;
  repoName?: string;
  className?: string;
  height?: number | string;
  width?: number | string;
  options?: Record<string, any>;
}

/**
 * Metadata for visualization component registration
 */
export interface VisualizationMetadata {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<VisualizationProps>;
  dataKeys: Array<keyof AnalysisData>;
  tags: string[];
}

/**
 * Common structure of commit-related data
 */
export interface CommitActivityData {
  date: string;
  count: number;
  [key: string]: any;
}

/**
 * Author contribution analysis result
 */
export interface AuthorContribution {
  name: string;
  email?: string;
  commits: number;
  firstCommit: string;
  lastCommit: string;
  daysActive: number;
}

/**
 * Commit word frequency data
 */
export interface WordFrequency {
  word: string;
  count: number;
  frequency: number;
}

/**
 * Commit pattern analysis result
 */
export interface CommitPatternAnalysis {
  byDayOfWeek: Record<string, number>;
  byHour: Record<string, number>;
  heatmap: Array<{
    day: string;
    hour: number;
    count: number;
  }>;
}

/**
 * Commit message analysis result
 */
export interface CommitMessageAnalysis {
  wordFrequencies: WordFrequency[];
  totalCommits: number;
}

/**
 * Repository activity summary
 */
export interface ActivitySummary {
  averageCommitsPerDay: number;
  projectDays: number;
  activityTrend: 'increasing' | 'decreasing' | 'stable';
  peakActivityPeriod?: {
    start: string;
    end: string;
    commits: number;
  };
}