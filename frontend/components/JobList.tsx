// components/JobList.tsx
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisJob } from '@/types';
import { formatDate, getRepoNameFromPath } from '@/utils';

interface JobListProps {
  jobs: AnalysisJob[];
  isLoading: boolean;
  error: string | null;
  selectedJob: AnalysisJob | null;
  onSelectJob: (job: AnalysisJob) => void;
}

export const JobStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === 'completed'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : status === 'failed'
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          : status === 'running'
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      }`}
    >
      {status === 'running' && <Loader2 className="animate-spin h-3 w-3 mr-1" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const JobList: React.FC<JobListProps> = ({
  jobs,
  isLoading,
  error,
  selectedJob,
  onSelectJob
}) => {
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded mb-4 text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (isLoading && jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-500">Loading jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No analysis jobs found. Start by analyzing a repository.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700">
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 border-b">Repository</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 border-b">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 border-b">Created</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 border-b">Completed</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedJob?.id === job.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <td className="px-4 py-3">
                <div className="font-medium">{getRepoNameFromPath(job.repo_path)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{job.repo_path}</div>
              </td>
              <td className="px-4 py-3">
                <JobStatusBadge status={job.status} />
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                {formatDate(job.created_at)}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                {job.completed_at ? formatDate(job.completed_at) : '-'}
              </td>
              <td className="px-4 py-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectJob(job)}
                >
                  {job.status === 'completed' ? 'View Results' : 'Details'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JobList;