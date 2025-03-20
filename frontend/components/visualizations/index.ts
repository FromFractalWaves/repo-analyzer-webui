// components/visualizations/index.ts
import { VisualizationProps, VisualizationMetadata } from './types';
import CommitTimeline from './CommitTimeline';
import CommitHeatmap from './CommitHeatmap';
import AuthorStats from './AuthorStats';
import CommitWordCloud from './CommitWordCloud';
import FileExtensionChart from './FileExtensionChart';

// Import placeholders for components that haven't been fully implemented yet
// These will be properly imported once they're implemented
const CodeDistribution = () => null;
const BranchesOverview = () => null;
const CommitActivity = () => null;

// Export visualization metadata to make it easy to register and use visualizations
export const VISUALIZATIONS: VisualizationMetadata[] = [
  {
    id: 'commit-timeline',
    name: 'Commit Timeline',
    description: 'Timeline of commits over time',
    component: CommitTimeline,
    dataKeys: ['commit_data'],
    tags: ['commits', 'timeline']
  },
  {
    id: 'code-distribution',
    name: 'Code Distribution',
    description: 'Distribution of code across repositories and file types',
    component: CodeDistribution,
    dataKeys: ['code_stats'],
    tags: ['code', 'files']
  },
  {
    id: 'commit-heatmap',
    name: 'Commit Activity Heatmap',
    description: 'Heatmap showing commit density by day and hour',
    component: CommitHeatmap,
    dataKeys: ['commit_data'],
    tags: ['commits', 'activity']
  },
  {
    id: 'author-stats',
    name: 'Author Statistics',
    description: 'Contribution statistics by author',
    component: AuthorStats,
    dataKeys: ['commit_data'],
    tags: ['authors', 'contributions']
  },
  {
    id: 'commit-word-cloud',
    name: 'Commit Message Word Cloud',
    description: 'Word cloud of frequent terms in commit messages',
    component: CommitWordCloud,
    dataKeys: ['summary_stats'],
    tags: ['commits', 'messages']
  },
  {
    id: 'branches-overview',
    name: 'Branches Overview',
    description: 'Overview of branches and their relationships',
    component: BranchesOverview,
    dataKeys: ['branch_data'],
    tags: ['branches']
  },
  {
    id: 'file-extension-chart',
    name: 'File Types Distribution',
    description: 'Distribution of files by extension',
    component: FileExtensionChart,
    dataKeys: ['code_stats', 'summary_stats'],
    tags: ['files', 'extensions']
  },
  {
    id: 'commit-activity',
    name: 'Commit Activity',
    description: 'Commit activity patterns over time',
    component: CommitActivity,
    dataKeys: ['commit_data', 'summary_stats'],
    tags: ['commits', 'activity']
  }
];

// Export the visualization components
export {
  CommitTimeline,
  CodeDistribution,
  CommitHeatmap,
  AuthorStats,
  CommitWordCloud,
  BranchesOverview,
  FileExtensionChart,
  CommitActivity
};

export type { VisualizationProps, VisualizationMetadata };