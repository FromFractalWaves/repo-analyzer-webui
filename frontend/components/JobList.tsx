// components/JobList.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitBranch, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  BarChart3
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { AnalysisJob } from '@/types';
import { formatDate } from '@/utils';

const JobList: React.FC = () => {
  const { 
    fetchJobs, 
    jobs, 
    isLoadingJobs, 
    jobsError, 
    selectedJob,
    setSelectedJob
  } = useAppContext();
  
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Load jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  
  // Filter jobs based on active filter
  const getFilteredJobs = () => {
    if (!jobs || jobs.length === 0) return [];
    
    if (activeFilter === 'all') return jobs;
    
    return jobs.filter(job => job.status === activeFilter);
  };
  
  // Get counts for different job statuses
  const getJobCounts = () => {
    if (!jobs || jobs.length === 0) return { all: 0, pending: 0, running: 0, completed: 0, failed: 0 };
    
    return {
      all: jobs.length,
      pending: jobs.filter(job => job.status === 'pending').length,
      running: jobs.filter(job => job.status === 'running').length,
      completed: jobs.filter(job => job.status === 'completed').length,
      failed: jobs.filter(job => job.status === 'failed').length
    };
  };
  
  // Handle job selection
  const handleSelectJob = (job: AnalysisJob) => {
    setSelectedJob(job);
  };
  
  // Get status icon based on job status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <GitBranch className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get status text with appropriate color
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="text-yellow-500">Pending</span>;
      case 'running':
        return <span className="text-blue-500">Running</span>;
      case 'completed':
        return <span className="text-green-500">Completed</span>;
      case 'failed':
        return <span className="text-red-500">Failed</span>;
      default:
        return <span className="text-gray-500">Unknown</span>;
    }
  };
  
  // Loading state
  if (isLoadingJobs) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p>Loading analysis jobs...</p>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (jobsError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{jobsError}</p>
          <Button 
            onClick={() => fetchJobs()} 
            variant="outline" 
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state with safe check that jobs is defined
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="mb-4">No analysis jobs found. Start by analyzing a repository.</p>
        <Button variant="outline" onClick={() => fetchJobs()}>Refresh Jobs</Button>
      </div>
    );
  }
  
  const filteredJobs = getFilteredJobs();
  const jobCounts = getJobCounts();
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Analysis Jobs</CardTitle>
          <CardDescription>
            View and manage repository analysis jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="all"
            value={activeFilter}
            onValueChange={setActiveFilter}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="all">
                All ({jobCounts.all})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({jobCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="running">
                Running ({jobCounts.running})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({jobCounts.completed})
              </TabsTrigger>
              <TabsTrigger value="failed">
                Failed ({jobCounts.failed})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeFilter} className="mt-0">
              <div className="space-y-2">
                {filteredJobs.map((job) => (
                  <div 
                    key={job.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors
                      ${job.id === selectedJob?.id ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                    `}
                    onClick={() => handleSelectJob(job)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(job.status)}
                        <div className="ml-3">
                          <h3 className="font-medium">
                            {job.repo_path.split('/').pop()}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {job.repo_path}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-4">
                          <p className="text-sm">{getStatusText(job.status)}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(job.created_at)}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectJob(job);
                          }}
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span className="ml-1">View</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredJobs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No {activeFilter !== 'all' ? activeFilter : ''} jobs found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobList;