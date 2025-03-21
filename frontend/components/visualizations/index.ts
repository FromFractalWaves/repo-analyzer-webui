// components/visualizations/index.ts
import { VisualizationProps, VisualizationMetadata } from './types';
import CommitTimeline from './CommitTimeline';
import CommitHeatmap from './CommitHeatmap';
import AuthorStats from './AuthorStats';
import CommitWordCloud from './CommitWordCloud';
import FileExtensionChart from './FileExtensionChart';

// Placeholder components
const CodeDistribution = () => null;
const BranchesOverview = () => null;
const CommitActivity = () => null;

// Export visualization metadata with more flexible data requirements
export const VISUALIZATIONS: VisualizationMetadata[] = [
  {
    id: 'commit-timeline',
    name: 'Commit Timeline',
    description: 'Timeline of commits over time',
    component: CommitTimeline,
    // Make data requirements more flexible
    dataKeys: ['commits', 'repository'],
    tags: ['commits', 'timeline']
  },
  {
    id: 'code-distribution',
    name: 'Code Distribution',
    description: 'Distribution of code across repositories and file types',
    component: CodeDistribution,
    dataKeys: ['code_stats', 'summary'],
    tags: ['code', 'files']
  },
  {
    id: 'commit-heatmap',
    name: 'Commit Activity Heatmap',
    description: 'Heatmap showing commit density by day and hour',
    component: CommitHeatmap,
    dataKeys: ['commits'],
    tags: ['commits', 'activity']
  },
  {
    id: 'author-stats',
    name: 'Author Statistics',
    description: 'Contribution statistics by author',
    component: AuthorStats,
    dataKeys: ['commits'],
    tags: ['authors', 'contributions']
  },
  {
    id: 'commit-word-cloud',
    name: 'Commit Message Word Cloud',
    description: 'Word cloud of frequent terms in commit messages',
    component: CommitWordCloud,
    dataKeys: ['commits', 'summary'],
    tags: ['commits', 'messages']
  },
  {
    id: 'branches-overview',
    name: 'Branches Overview',
    description: 'Overview of branches and their relationships',
    component: BranchesOverview,
    dataKeys: ['branches'],
    tags: ['branches']
  },
  {
    id: 'file-extension-chart',
    name: 'File Types Distribution',
    description: 'Distribution of files by extension',
    component: FileExtensionChart,
    dataKeys: ['summary', 'code_stats'],
    tags: ['files', 'extensions']
  },
  {
    id: 'commit-activity',
    name: 'Commit Activity',
    description: 'Commit activity patterns over time',
    component: CommitActivity,
    dataKeys: ['commits', 'summary'],
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