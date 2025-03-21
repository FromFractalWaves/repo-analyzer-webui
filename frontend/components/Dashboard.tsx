// components/Dashboard.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';
import { FolderGit, GitBranch, BarChart3 } from 'lucide-react';

// Import components for different tabs
import RepoDiscovery from './RepoDiscovery';
import JobList from './JobList';
import ResultsPanel from './ResultsPanel';
import { EnhancedRepositoryDiscovery } from './repository';

const Dashboard: React.FC = () => {
  const { activeTab, setActiveTab, jobs, selectedJob } = useAppContext();

  const handleTabChange = (value: string) => {
    // If switching to results tab but no job is selected and we have jobs,
    // redirect to jobs tab instead
    if (value === 'results' && !selectedJob && jobs && jobs.length > 0) {
      setActiveTab('jobs');
      return;
    }
    
    setActiveTab(value as 'discover' | 'repositories' | 'jobs' | 'results');
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Repo Analyzer</h1>
          <TabsList>
            <TabsTrigger value="discover" className="flex items-center gap-1">
              <FolderGit className="h-4 w-4" />
              <span className="hidden sm:inline">Repositories</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="discover">
          <EnhancedRepositoryDiscovery />
        </TabsContent>
        
        <TabsContent value="jobs">
          <JobList />
        </TabsContent>
        
        <TabsContent value="results">
          <ResultsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;