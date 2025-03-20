// components/JobDetails.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisJob } from '@/types';
import { formatDate } from '@/utils';
import { JobStatusBadge } from './JobList';

interface JobDetailsProps {
  job: AnalysisJob;
  onViewResults: () => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ job, onViewResults }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500 block">Job ID</span>
              <span className="font-mono">{job.id}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Repository Path</span>
              <span>{job.repo_path}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Created At</span>
              <span>{formatDate(job.created_at)}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500 block">Status</span>
              <JobStatusBadge status={job.status} />
            </div>
            <div>
              <span className="text-sm text-gray-500 block">Completed At</span>
              <span>{job.completed_at ? formatDate(job.completed_at) : '-'}</span>
            </div>
            {job.error && (
              <div>
                <span className="text-sm text-gray-500 block">Error</span>
                <span className="text-red-600 dark:text-red-400">{job.error}</span>
              </div>
            )}
          </div>
        </div>
        
        {job.status === 'completed' && (
          <div className="mt-6">
            <Button onClick={onViewResults}>
              View Analysis Results
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobDetails;