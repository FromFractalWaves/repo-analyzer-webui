// components/visualizations/CommitWordCloud.tsx
import React, { useMemo } from 'react';
import { VisualizationProps } from './index';
import { analyzeCommitMessages } from '@/utils/analysisUtils';

const CommitWordCloud: React.FC<VisualizationProps> = ({
  data,
  repoName,
  height = 400,
  width = '100%',
  className,
  options = {}
}) => {
  const wordCloudData = useMemo(() => {
    if (!data.commit_data || Object.keys(data.commit_data).length === 0) {
      return { wordFrequencies: [], totalCommits: 0 };
    }

    // Filter data for a specific repo if provided
    const filteredCommitData = repoName
      ? { [repoName]: data.commit_data[repoName] }
      : data.commit_data;
    
    return analyzeCommitMessages(filteredCommitData);
  }, [data.commit_data, repoName]);
  
  // Get top words for visualization (limit to 100 for performance)
  const topWords = useMemo(() => {
    return wordCloudData.wordFrequencies.slice(0, 100);
  }, [wordCloudData]);
  
  // Function to calculate font size based on frequency
  const getFontSize = (count: number, maxCount: number) => {
    const minSize = 12;
    const maxSize = 60;
    
    if (maxCount === 0) return minSize;
    
    // Non-linear scaling to make differences more visible
    const scale = Math.log(count + 1) / Math.log(maxCount + 1);
    return minSize + scale * (maxSize - minSize);
  };
  
  // Color palette for words
  const getWordColor = (index: number, count: number, maxCount: number) => {
    const colors = [
      '#3b82f6', '#60a5fa', '#2563eb', // blues
      '#8b5cf6', '#a78bfa', '#7c3aed', // purples
      '#10b981', '#34d399', '#059669', // greens
      '#f59e0b', '#fbbf24', '#d97706', // ambers
      '#ef4444', '#f87171', '#dc2626', // reds
    ];
    
    // Calculate color based on both position and frequency
    const frequencyFactor = (count / maxCount);
    const colorIndex = Math.floor(index % colors.length);
    
    return colors[colorIndex];
  };
  
  if (topWords.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded p-4 ${className}`} style={{ height, width }}>
        <p className="text-gray-500">No commit message data available</p>
      </div>
    );
  }
  
  const maxCount = topWords[0].count;
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium mb-4">Commit Message Word Cloud</h3>
      
      <div 
        className="overflow-hidden p-4 flex flex-wrap justify-center items-center"
        style={{ height: `${height}px`, maxHeight: `${height}px` }}
      >
        {topWords.map((word, index) => (
          <div 
            key={word.word} 
            className="inline-block m-2 transition-transform hover:scale-110"
            style={{ 
              fontSize: `${getFontSize(word.count, maxCount)}px`,
              color: getWordColor(index, word.count, maxCount),
              fontWeight: word.count > maxCount * 0.5 ? 'bold' : 'normal',
              cursor: 'default'
            }}
            title={`${word.word}: ${word.count} occurrences (${Math.round(word.frequency * 100)}%)`}
          >
            {word.word}
          </div>
        ))}
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="border dark:border-gray-700 rounded p-3">
          <h4 className="text-sm font-medium mb-2">Most Common Terms</h4>
          <div className="space-y-1">
            {topWords.slice(0, 5).map((word) => (
              <div key={word.word} className="flex justify-between text-sm">
                <span className="text-blue-600 font-medium">{word.word}</span>
                <span className="text-gray-600">{word.count} occurrences</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border dark:border-gray-700 rounded p-3">
          <h4 className="text-sm font-medium mb-2">Word Stats</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Words Analyzed:</span>
              <span className="font-medium">{wordCloudData.wordFrequencies.reduce((sum, w) => sum + w.count, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Unique Words:</span>
              <span className="font-medium">{wordCloudData.wordFrequencies.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commits Analyzed:</span>
              <span className="font-medium">{wordCloudData.totalCommits}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitWordCloud;