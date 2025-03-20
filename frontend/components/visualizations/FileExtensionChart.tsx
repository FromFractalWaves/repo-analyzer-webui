// components/visualizations/FileExtensionChart.tsx
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { VisualizationProps } from './types';

const FileExtensionChart: React.FC<VisualizationProps> = ({
  data,
  repoName,
  height = 400,
  width = '100%',
  className,
  options = {}
}) => {
  const chartData = useMemo(() => {
    if (!data.code_stats || !Object.keys(data.code_stats).length) {
      return [];
    }

    // If a specific repo is selected, only show that repo's data
    const repos = repoName ? [repoName] : Object.keys(data.code_stats);
    
    // Collect extension data across repos
    const extensionCounts: Record<string, number> = {};
    
    repos.forEach(repo => {
      if (data.code_stats[repo] && data.code_stats[repo].file_extensions) {
        Object.entries(data.code_stats[repo].file_extensions).forEach(([ext, count]) => {
          // Clean the extension
          const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
          extensionCounts[cleanExt] = (extensionCounts[cleanExt] || 0) + (count as number);
        });
      }
    });
    
    // Convert to chart data format
    const chartData = Object.entries(extensionCounts)
      .map(([extension, count]) => ({
        extension,
        count,
        percentage: 0 // Will calculate below
      }))
      .sort((a, b) => b.count - a.count);
    
    // Calculate percentages
    const totalFiles = chartData.reduce((sum, item) => sum + item.count, 0);
    chartData.forEach(item => {
      item.percentage = Math.round((item.count / totalFiles) * 100);
    });
    
    // Limit to top 10 extensions and group the rest as "Other"
    if (chartData.length > 10) {
      const top10 = chartData.slice(0, 10);
      const others = chartData.slice(10);
      
      const otherCount = others.reduce((sum, item) => sum + item.count, 0);
      const otherPercentage = others.reduce((sum, item) => sum + item.percentage, 0);
      
      top10.push({
        extension: 'Other',
        count: otherCount,
        percentage: otherPercentage
      });
      
      return top10;
    }
    
    return chartData;
  }, [data.code_stats, repoName]);
  
  // Colors for the pie chart
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a4de6c',
    '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#d0ed57',
    '#83a6ed'
  ];
  
  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded p-4 ${className}`} style={{ height, width }}>
        <p className="text-gray-500">No file extension data available</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium mb-4">File Types Distribution</h3>
      <ResponsiveContainer width={width} height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={160}
            dataKey="count"
            nameKey="extension"
            label={({ extension, percentage }: { extension: string, percentage: number }) => `${extension} (${percentage}%)`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any, props: any) => [
              `${value} files (${props.payload.percentage}%)`,
              `File extension: ${props.payload.extension}`
            ]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value: any, entry: any) => {
              const { extension, count, percentage } = entry.payload;
              return `${extension} (${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FileExtensionChart;