// components/visualizations/CommitHeatmap.tsx
import React, { useMemo } from 'react';
import { VisualizationProps } from './index';
import { analyzeCommitPatterns } from '@/utils/analysisUtils';

const CommitHeatmap: React.FC<VisualizationProps> = ({
  data,
  repoName,
  height = 300,
  width = '100%',
  className,
  options = {}
}) => {
  const heatmapData = useMemo(() => {
    if (!data.commit_data || Object.keys(data.commit_data).length === 0) {
      return { byDayOfWeek: {}, byHour: {}, heatmap: [] };
    }

    // Filter data for a specific repo if provided
    const filteredCommitData = repoName
      ? { [repoName]: data.commit_data[repoName] }
      : data.commit_data;
    
    return analyzeCommitPatterns(filteredCommitData);
  }, [data.commit_data, repoName]);
  
  // Get max count for color scaling
  const maxCount = useMemo(() => {
    if (heatmapData.heatmap.length === 0) return 0;
    return Math.max(...heatmapData.heatmap.map(item => item.count));
  }, [heatmapData]);
  
  // Calculate color for a cell based on commit count
  const getCellColor = (count: number) => {
    if (count === 0) return '#f3f4f6'; // Light gray for no commits
    
    const intensity = Math.min(0.1 + (count / maxCount) * 0.9, 1);
    return `rgba(59, 130, 246, ${intensity})`; // Blue with varying opacity
  };
  
  // Helper function to render time labels
  const renderTimeLabels = () => {
    return Array.from({ length: 24 }, (_, hour) => (
      <div 
        key={`time-${hour}`} 
        className="text-xs text-gray-500 text-center"
        style={{ height: '20px' }}
      >
        {hour === 0 ? '12am' : hour === 12 ? '12pm' : hour > 12 ? `${hour-12}pm` : `${hour}am`}
      </div>
    ));
  };
  
  if (heatmapData.heatmap.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded p-4 ${className}`} style={{ height, width }}>
        <p className="text-gray-500">No commit data available</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium mb-4">Commit Activity Heatmap</h3>
      
      <div className="flex">
        {/* Day labels column */}
        <div className="flex flex-col justify-around pr-2 py-5">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="text-xs text-gray-500">
              {day.substring(0, 3)}
            </div>
          ))}
        </div>
        
        {/* Heatmap grid */}
        <div className="flex-1">
          {/* Time labels row */}
          <div className="flex mb-1 pl-1">
            {renderTimeLabels()}
          </div>
          
          {/* Heatmap cells */}
          <div className="grid grid-cols-24 gap-1">
            {heatmapData.heatmap.map((cell, index) => (
              <div 
                key={`cell-${index}`}
                className="aspect-square rounded"
                style={{ 
                  backgroundColor: getCellColor(cell.count),
                  gridColumn: `${(cell.hour % 24) + 1} / span 1`,
                  gridRow: `${Math.floor(index / 24) + 1} / span 1`
                }}
                title={`${cell.day} at ${cell.hour}:00 - ${cell.count} commits`}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex justify-end items-center mt-4 gap-2">
            <div className="text-xs text-gray-500">Less</div>
            {Array.from({ length: 5 }, (_, i) => (
              <div 
                key={`legend-${i}`}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getCellColor(Math.ceil((maxCount * (i + 1)) / 5)) }}
              />
            ))}
            <div className="text-xs text-gray-500">More</div>
          </div>
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="border dark:border-gray-700 rounded p-3">
          <h4 className="text-sm font-medium mb-2">Most Active Day</h4>
          {Object.entries(heatmapData.byDayOfWeek)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 1)
            .map(([day, count]) => (
              <div key={day} className="flex justify-between">
                <span className="text-blue-600 font-medium">{day}</span>
                <span className="text-gray-600">{count} commits</span>
              </div>
            ))}
        </div>
        
        <div className="border dark:border-gray-700 rounded p-3">
          <h4 className="text-sm font-medium mb-2">Most Active Time</h4>
          {Object.entries(heatmapData.byHour)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 1)
            .map(([hour, count]) => {
              const hourNum = parseInt(hour);
              const timeStr = hourNum === 0 ? '12 AM' : 
                             hourNum === 12 ? '12 PM' : 
                             hourNum > 12 ? `${hourNum-12} PM` : 
                             `${hourNum} AM`;
              
              return (
                <div key={hour} className="flex justify-between">
                  <span className="text-blue-600 font-medium">{timeStr}</span>
                  <span className="text-gray-600">{count} commits</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default CommitHeatmap;