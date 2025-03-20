// components/visualizations/CommitTimeline.tsx
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { VisualizationProps } from './types';
import { CommitData } from '@/types';
import { parseISO, format, startOfDay, addDays, eachDayOfInterval } from 'date-fns';

const CommitTimeline: React.FC<VisualizationProps> = ({
  data,
  repoName,
  height = 400,
  width = '100%',
  className,
  options = {}
}) => {
  const chartData = useMemo(() => {
    if (!data.commit_data || !Object.keys(data.commit_data).length) {
      return [];
    }

    // If a specific repo is selected, only show that repo's data
    const repos = repoName ? [repoName] : Object.keys(data.commit_data);
    
    // Get all commit dates from all repos and sort them
    const allDatesSet = new Set<string>();
    repos.forEach(repo => {
      if (data.commit_data[repo]) {
        data.commit_data[repo].forEach((commit: CommitData) => {
          // Use start of day to group commits by day
          const commitDate = startOfDay(parseISO(commit.commit_date));
          allDatesSet.add(commitDate.toISOString());
        });
      }
    });
    
    // Convert to array and sort
    const allDates = Array.from(allDatesSet).sort();
    
    if (allDates.length === 0) {
      return [];
    }
    
    // Create a continuous date range
    const firstDate = parseISO(allDates[0]);
    const lastDate = parseISO(allDates[allDates.length - 1]);
    
    // Generate all days in the interval
    const dateRange = eachDayOfInterval({
      start: firstDate,
      end: lastDate
    }).map(date => date.toISOString());
    
    // Initialize counters for each repo per day
    const commitCountByDate: Record<string, Record<string, number>> = {};
    
    dateRange.forEach(dateStr => {
      commitCountByDate[dateStr] = {};
      repos.forEach(repo => {
        commitCountByDate[dateStr][repo] = 0;
      });
      
      // Add total count field
      commitCountByDate[dateStr]['total'] = 0;
    });
    
    // Count commits per day per repo
    repos.forEach(repo => {
      if (data.commit_data[repo]) {
        data.commit_data[repo].forEach((commit: CommitData) => {
          const commitDate = startOfDay(parseISO(commit.commit_date)).toISOString();
          if (commitCountByDate[commitDate]) {
            commitCountByDate[commitDate][repo] += 1;
            commitCountByDate[commitDate]['total'] += 1;
          }
        });
      }
    });
    
    // Convert to chart data format
    return dateRange.map(date => {
      const formattedDate = format(parseISO(date), 'yyyy-MM-dd');
      return {
        date: formattedDate,
        ...commitCountByDate[date]
      };
    });
  }, [data.commit_data, repoName]);
  
  // Get colors for each repo
  const repoColors = useMemo(() => {
    const colorPalette = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
      '#8dd1e1', '#a4de6c', '#d0ed57', '#ffc658'
    ];
    
    const repos = repoName 
      ? [repoName] 
      : (data.commit_data ? Object.keys(data.commit_data) : []);
    
    return repos.reduce((acc, repo, index) => {
      acc[repo] = colorPalette[index % colorPalette.length];
      return acc;
    }, {} as Record<string, string>);
  }, [data.commit_data, repoName]);
  
  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded p-4 ${className}`} style={{ height, width }}>
        <p className="text-gray-500">No commit data available</p>
      </div>
    );
  }
  
  // Determine which repos to show
  const repos = repoName 
    ? [repoName] 
    : (data.commit_data ? Object.keys(data.commit_data) : []);
  
  // Show total instead of individual repos if there are too many
  const showTotal = repos.length > 5 || options.showTotal;
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium mb-4">Commit Activity Over Time</h3>
      <ResponsiveContainer width={width} height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            angle={-45} 
            textAnchor="end"
            height={60}
            tickFormatter={(value: string) => format(parseISO(value), 'MMM d')}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: any) => [value, name === 'total' ? 'Total Commits' : `Commits in ${name}`]}
            labelFormatter={(label: any) => format(parseISO(label), 'MMMM d, yyyy')}
          />
          <Legend />
          
          {showTotal ? (
            <Line 
              type="monotone" 
              dataKey="total" 
              name="Total Commits" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
              strokeWidth={2}
            />
          ) : (
            repos.map(repo => (
              <Line 
                key={repo}
                type="monotone" 
                dataKey={repo} 
                name={repo} 
                stroke={repoColors[repo]} 
                activeDot={{ r: 6 }} 
              />
            ))
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CommitTimeline;