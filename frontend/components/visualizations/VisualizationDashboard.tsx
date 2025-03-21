// components/visualizations/VisualizationDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, GitBranch, GitFork, Zap,
  ChevronDown, ChevronUp, Loader2, RefreshCw
} from 'lucide-react';
import { AnalysisData, AnalysisJob } from '@/types';
import { generateActivitySummary } from '@/utils/analysisUtils';
import { Button } from '@/components/ui/button';
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from '@/components/ui/card';
import { formatNumber } from '@/utils';

// Import visualization components
import VisualizationSelector from './VisualizationSelector';
import RepositorySelector from './RepositorySelector';
import MetricCard from './MetricCard';
import VisualizationContainer from './VisualizationContainer';
import ExportOptions from './ExportOptions';
import CommitTimeline from './CommitTimeline';
import CommitHeatmap from './CommitHeatmap';
import AuthorStats from './AuthorStats';
import FileExtensionChart from './FileExtensionChart';
import CommitWordCloud from './CommitWordCloud';

// Define visualization components list
const VISUALIZATIONS = [
  {
    id: 'commit-timeline',
    name: 'Commit Timeline',
    description: 'Timeline of commits over time',
    component: CommitTimeline,
    dataKeys: ['commit_data']
  },
  {
    id: 'commit-heatmap',
    name: 'Commit Activity Heatmap',
    description: 'Heatmap showing commit density by day and hour',
    component: CommitHeatmap,
    dataKeys: ['commit_data']
  },
  {
    id: 'author-stats',
    name: 'Author Statistics',
    description: 'Contribution statistics by author',
    component: AuthorStats,
    dataKeys: ['commit_data']
  },
  {
    id: 'commit-word-cloud',
    name: 'Commit Message Word Cloud',
    description: 'Word cloud of frequent terms in commit messages',
    component: CommitWordCloud,
    dataKeys: ['commit_data']
  },
  {
    id: 'file-extension-chart',
    name: 'File Types Distribution',
    description: 'Distribution of files by extension',
    component: FileExtensionChart,
    dataKeys: ['code_stats']
  }
];

interface VisualizationDashboardProps {
  job: AnalysisJob;
  data: AnalysisData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
  className?: string;
}

const VisualizationDashboard: React.FC<VisualizationDashboardProps> = ({
  job,
  data,
  isLoading,
  error,
  onRefresh,
  className
}) => {
  // States
  const [activitySummary, setActivitySummary] = useState<any>(null);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [selectedVisualizations, setSelectedVisualizations] = useState<string[]>([
    'commit-timeline', 'commit-heatmap', 'author-stats', 'file-extension-chart'
  ]);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    visualizations: true,
    details: false
  });

  // Generate summary statistics when data changes
  useEffect(() => {
    if (data) {
      try {
        const summary = generateActivitySummary(data);
        setActivitySummary(summary);
      } catch (error) {
        console.error("Failed to generate activity summary:", error);
      }
    }
  }, [data]);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({...prev, [section]: !prev[section]}));
  };

  // Handle loading, error, and no data states
  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium">Loading Repository Analysis Data</h3>
          <p className="text-gray-500 mt-2">This might take a moment...</p>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-200">Error Loading Analysis Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          {onRefresh && (
            <Button 
              variant="destructive" 
              onClick={onRefresh}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium">No Analysis Data Available</h3>
          <p className="text-gray-500 mt-2">There is no data for this job yet.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate stats
  const calculateStats = () => {
    if (!data) return { totalCommits: 0, totalBranches: 0, totalLines: 0, reposAnalyzed: 0 };
    
    // If we have aggregate_stats, use them
    if (data.aggregate_stats) {
      return data.aggregate_stats;
    }
    
    // For summary data
    if (data.summary) {
      return {
        totalCommits: data.summary.num_commits || 0,
        totalBranches: data.summary.num_branches || 0,
        totalLines: data.summary.total_lines || 0,
        reposAnalyzed: 1
      };
    }
    
    // For multiple repos with summary_stats
    if (data.summary_stats) {
      const totalCommits = Object.values(data.summary_stats).reduce((sum, stat) => sum + (stat.num_commits || 0), 0);
      const totalBranches = Object.values(data.summary_stats).reduce((sum, stat) => sum + (stat.num_branches || 0), 0);
      const totalLines = Object.values(data.summary_stats).reduce((sum, stat) => sum + (stat.total_lines || 0), 0);
      
      return {
        totalCommits,
        totalBranches,
        totalLines,
        reposAnalyzed: Object.keys(data.summary_stats).length
      };
    }
    
    // If we have commit_data, try to extract some stats
    if (data.commit_data) {
      const totalCommits = Object.values(data.commit_data).reduce((sum, commits) => sum + commits.length, 0);
      return {
        totalCommits,
        totalBranches: 0, // Can't determine without branch data
        totalLines: 0, // Can't determine without code stats
        reposAnalyzed: Object.keys(data.commit_data).length
      };
    }
    
    return { totalCommits: 0, totalBranches: 0, totalLines: 0, reposAnalyzed: 0 };
  };
  
  const stats = calculateStats();
  
  // Get repository options for selector
  const getRepositoryOptions = () => {
    if (data.repository) {
      // Single repository case
      return [data.repository.name];
    }
    
    if (data.commit_data) {
      // Multiple repositories case
      return Object.keys(data.commit_data);
    }
    
    return [];
  };
  
  const repoOptions = getRepositoryOptions();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              <h2 className="text-lg font-semibold">Repository Analysis Dashboard</h2>
            </div>
            
            <div className="flex gap-2 flex-wrap items-center">
              {repoOptions.length > 0 && (
                <RepositorySelector 
                  repositories={repoOptions}
                  selectedRepository={selectedRepo}
                  onRepositoryChange={setSelectedRepo}
                />
              )}
              <ExportOptions jobId={job.id} />
              {onRefresh && (
                <Button variant="outline" onClick={onRefresh} size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card>
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('summary')}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Summary Statistics</CardTitle>
            {expandedSections.summary ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </div>
          <CardDescription>Overview of repository analytics</CardDescription>
        </CardHeader>
        
        {expandedSections.summary && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                title="Total Commits"
                value={formatNumber(stats.totalCommits)}
                icon={GitBranch}
                color="bg-blue-500"
                subtitle={activitySummary && activitySummary.averageCommitsPerDay ? 
                  `${activitySummary.averageCommitsPerDay.toFixed(1)} per day` : 
                  undefined}
              />
              
              <MetricCard 
                title="Branches"
                value={formatNumber(stats.totalBranches)}
                icon={GitFork}
                color="bg-green-500"
                subtitle={`Across ${stats.reposAnalyzed} ${stats.reposAnalyzed === 1 ? 'repository' : 'repositories'}`}
              />
              
              <MetricCard 
                title="Lines of Code"
                value={formatNumber(stats.totalLines)}
                icon={BarChart3}
                color="bg-purple-500"
                subtitle={stats.totalCommits > 0 
                  ? `~${Math.round(stats.totalLines / stats.totalCommits)} per commit` 
                  : undefined
                }
              />
              
              {activitySummary && (
                <MetricCard 
                  title="Project Activity"
                  value={activitySummary.activityTrend === 'increasing' 
                    ? 'Increasing' 
                    : activitySummary.activityTrend === 'decreasing' 
                      ? 'Decreasing' 
                      : 'Stable'
                  }
                  icon={Zap}
                  color="bg-amber-500"
                  subtitle={`${activitySummary.projectDays} days of activity`}
                  trend={activitySummary.activityTrend === 'increasing' 
                    ? { value: 15, label: 'vs previous period', isPositive: true }
                    : activitySummary.activityTrend === 'decreasing'
                      ? { value: 12, label: 'vs previous period', isPositive: false }
                      : undefined
                  }
                />
              )}
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Visualizations Section */}
      <Card>
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('visualizations')}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Visualizations</CardTitle>
            {expandedSections.visualizations ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </div>
          <CardDescription>Interactive charts and visualizations</CardDescription>
        </CardHeader>
        
        {expandedSections.visualizations && (
          <CardContent>
            <div className="mb-6">
              <VisualizationSelector
                selectedVisualizations={selectedVisualizations}
                onSelectionChange={setSelectedVisualizations}
              />
            </div>
            
            {selectedVisualizations.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <h3 className="text-lg font-medium text-gray-500">No Visualizations Selected</h3>
                <p className="text-sm text-gray-400 mt-1 mb-4">
                  Use the visualization selector above to choose which charts to display
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedVisualizations(['commit-timeline', 'commit-heatmap', 'author-stats', 'file-extension-chart'])}
                >
                  Show Recommended Charts
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedVisualizations.map(visId => {
                  const visConfig = VISUALIZATIONS.find(vis => vis.id === visId);
                  if (!visConfig) return null;
                  
                  // Check if required data is available
                  const hasRequiredData = visConfig.dataKeys.every(key => {
                    // Handle special cases for compatibility
                    if (key === 'summary_stats' && data.summary) return true;
                    if (key === 'code_stats' && data.summary && data.summary.file_extensions) return true;
                    
                    return data[key as keyof AnalysisData] !== undefined;
                  });
                  
                  if (!hasRequiredData) return null;
                  
                  const VisualizationComponent = visConfig.component;
                  
                  return (
                    <VisualizationContainer
                      key={visId}
                      title={visConfig.name}
                      description={visConfig.description}
                      visualization={VisualizationComponent}
                      visualizationProps={{
                        data,
                        repoName: selectedRepo || undefined,
                        height: 400,
                        width: '100%'
                      }}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
      
      {/* Repository Details Section */}
      <Card>
        <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleSection('details')}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Repository Details</CardTitle>
            {expandedSections.details ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </div>
          <CardDescription>Detailed repository statistics</CardDescription>
        </CardHeader>
        
        {expandedSections.details && (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repository</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commits</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branches</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lines of Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Commit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Commit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {renderRepositoryRows(data)}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

// Helper function to render repository rows in details table
function renderRepositoryRows(data: AnalysisData) {
  if (data.summary_stats) {
    // Multiple repositories case
    return Object.entries(data.summary_stats).map(([repo, stats]) => (
      <tr key={repo} className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{repo}</td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatNumber(stats.num_commits || 0)}</td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatNumber(stats.num_branches || 0)}</td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatNumber(stats.total_lines || 0)}</td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
          {stats.first_commit ? new Date(stats.first_commit).toLocaleDateString() : 'N/A'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
          {stats.last_commit ? new Date(stats.last_commit).toLocaleDateString() : 'N/A'}
        </td>
      </tr>
    ));
  } else if (data.summary) {
    // Single repository case
    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
          {data.repository?.name || 'Repository'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatNumber(data.summary.num_commits || 0)}</td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatNumber(data.summary.num_branches || 0)}</td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatNumber(data.summary.total_lines || 0)}</td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
          {data.summary.first_commit ? new Date(data.summary.first_commit).toLocaleDateString() : 'N/A'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
          {data.summary.last_commit ? new Date(data.summary.last_commit).toLocaleDateString() : 'N/A'}
        </td>
      </tr>
    );
  } else {
    return (
      <tr>
        <td colSpan={6} className="px-4 py-3 text-center text-sm text-gray-500">
          No repository details available
        </td>
      </tr>
    );
  }
}

export default VisualizationDashboard;