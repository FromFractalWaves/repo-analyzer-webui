// components/ResultsPanel.tsx
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisJob, AnalysisData } from '@/types';
import VisualizationDashboard from '@/components/visualizations/VisualizationDashboard';

interface ResultsPanelProps {
  job: AnalysisJob;
  data: AnalysisData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  job,
  data,
  isLoading,
  error,
  onRefresh
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <h3 className="text-xl font-medium mb-2">Loading Analysis Results...</h3>
        <p className="text-gray-500">This might take a moment for large repositories.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Error Loading Results</h3>
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button 
          variant="outline"
          className="mt-4"
          onClick={onRefresh}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <h3 className="text-xl font-medium mb-2">No Analysis Data Available</h3>
        <p className="text-gray-500 mb-4">The analysis data for this job is not available.</p>
        <Button onClick={onRefresh}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <VisualizationDashboard
      job={job}
      data={data}
      isLoading={isLoading}
      error={error}
      onRefresh={onRefresh}
    />
  );
};

export default ResultsPanel;