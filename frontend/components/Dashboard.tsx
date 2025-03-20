// analyzer_webui/components/Dashboard.tsx (updated)
'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { GitBranch } from 'lucide-react';

// Import modular components
import TabNavigation from './TabNavigation';
import EnhancedRepositoryDiscovery from './repository/EnhancedRepositoryDiscovery'; // New import
import JobList from './JobList';
import JobDetails from './JobDetails';
import ResultsPanel from './ResultsPanel';

const Dashboard: React.FC = () => {
  // Local state
  const [showJobDetails, setShowJobDetails] = useState<boolean>(false);
  
  // Access store state and actions
  const {
    activeTab,
    setActiveTab,
    selectedRepo,
    jobs,
    isLoadingJobs,
    jobsError,
    selectedJob,
    setSelectedJob,
    fetchJobs,
    fetchJob,
    analysisResults,
    isLoadingResults,
    resultsError,
    fetchResults
  } = useStore();

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for job status if there's a selected job that's not completed
  useEffect(() => {
    if (selectedJob && ['pending', 'running'].includes(selectedJob.status)) {
      const interval = setInterval(() => {
        fetchJob(selectedJob.id);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [selectedJob, fetchJob]);

  // Fetch results when a completed job is selected
  useEffect(() => {
    if (selectedJob && selectedJob.status === 'completed') {
      fetchResults(selectedJob.id);
    }
  }, [selectedJob, fetchResults]);

  // Check if there's a completed job selected
  const hasCompletedJob = !!selectedJob && selectedJob.status === 'completed';

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center">
          <GitBranch className="mr-2 h-8 w-8 text-blue-500" />
          Repository Analyzer
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Analyze git repositories to visualize commit history, code distribution, and more.
        </p>
        
        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasCompletedJob={hasCompletedJob}
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'discover' && <EnhancedRepositoryDiscovery />}

      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {/* Job List Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <GitBranch className="mr-2 h-5 w-5 text-blue-500" />
              Analysis Jobs
            </h2>
            
            <JobList
              jobs={jobs}
              isLoading={isLoadingJobs}
              error={jobsError}
              selectedJob={selectedJob}
              onSelectJob={(job) => {
                setSelectedJob(job);
                setShowJobDetails(true);
              }}
            />
          </div>
          
          {/* Job Details Panel (conditionally rendered) */}
          {selectedJob && showJobDetails && (
            <JobDetails 
              job={selectedJob}
              onViewResults={() => {
                if (selectedJob.status === 'completed') {
                  setActiveTab('results');
                }
              }}
            />
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && selectedJob && (
        <ResultsPanel
          job={selectedJob}
          data={analysisResults}
          isLoading={isLoadingResults}
          error={resultsError}
          onRefresh={() => fetchResults(selectedJob.id)}
        />
      )}
    </div>
  );
};

export default Dashboard;