// components/visualizations/AuthorStats.tsx
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { VisualizationProps } from './index';
import { analyzeAuthorContributions } from '@/utils/analysisUtils';
import { parseISO, format } from 'date-fns';

const AuthorStats: React.FC<VisualizationProps> = ({
  data,
  repoName,
  height = 400,
  width = '100%',
  className,
  options = {}
}) => {
  const authorData = useMemo(() => {
    if (!data.commit_data || Object.keys(data.commit_data).length === 0) {
      return [];
    }

    // Filter data for a specific repo if provided
    const filteredCommitData = repoName
      ? { [repoName]: data.commit_data[repoName] }
      : data.commit_data;
      
    return analyzeAuthorContributions(filteredCommitData);
  }, [data.commit_data, repoName]);
  
  // Limit to top 10 contributors for chart display
  const topContributors = useMemo(() => {
    return authorData.slice(0, 10).map(author => ({
      name: author.name,
      commits: author.commits,
      percent: Math.round((author.commits / authorData.reduce((sum, a) => sum + a.commits, 0)) * 100)
    }));
  }, [authorData]);
  
  // Color for bars
  const getBarColor = (index: number) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
      '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'
    ];
    return colors[index % colors.length];
  };

  if (authorData.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded p-4 ${className}`} style={{ height, width }}>
        <p className="text-gray-500">No author data available</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium mb-4">Author Contributions</h3>
      
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={topContributors}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [
                `${value} commits (${topContributors.find(c => c.commits === value)?.percent}%)`,
                'Contributions'
              ]}
            />
            <Bar dataKey="commits" radius={[4, 4, 0, 0]}>
              {topContributors.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6">
        <h4 className="text-md font-medium mb-3">Contributors Detail</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commits
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Commit
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Commit
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity Period
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {authorData.slice(0, 15).map((author, index) => (
                <tr key={author.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 text-sm font-medium" style={{ color: getBarColor(index) }}>
                    {author.name}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    {author.commits} 
                    <span className="text-xs text-gray-500 ml-1">
                      ({Math.round((author.commits / authorData.reduce((sum, a) => sum + a.commits, 0)) * 100)}%)
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    {format(parseISO(author.firstCommit), 'MMM d, yyyy')}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    {format(parseISO(author.lastCommit), 'MMM d, yyyy')}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    {author.daysActive > 1 ? `${author.daysActive} days` : '1 day'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {authorData.length > 15 && (
          <div className="text-center mt-4 text-sm text-gray-500">
            {authorData.length - 15} more contributors not shown
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorStats;