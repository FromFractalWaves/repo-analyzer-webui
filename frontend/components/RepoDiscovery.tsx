// components/RepoDiscovery.tsx
'use client';

import React, { useState } from 'react';
import { useStore } from '@/store';
import { GitBranch, Folder, Loader2, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Repository } from '@/types';
import { getRepoNameFromPath } from '@/utils';
import DirectoryBrowser from './DirectoryBrowser';

const RepoDiscovery: React.FC = () => {
  // Store state
  const {
    repositories,
    isLoadingRepositories,
    repositoriesError,
    selectedRepo,
    setSelectedRepo,
    discoverRepositories,
    clearRepositories,
    startAnalysis,
    setActiveTab
  } = useStore();

  // Local state
  const [currentPath, setCurrentPath] = useState<string>('~/');
  const [repoDepth, setRepoDepth] = useState<number>(2);
  const [isDirectoryBrowserOpen, setIsDirectoryBrowserOpen] = useState<boolean>(false);
  const [analysisInProgress, setAnalysisInProgress] = useState<boolean>(false);

  // Handle directory selection
  const handleDirectorySelect = (path: string) => {
    setCurrentPath(path);
    setIsDirectoryBrowserOpen(false);
    // Optionally trigger repository discovery immediately
    discoverRepositories(path, repoDepth);
  };

  // Handle manual path input
  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPath(e.target.value);
  };

  // Discover repositories
  const handleDiscoverRepos = () => {
    if (currentPath) {
      discoverRepositories(currentPath, repoDepth);
    }
  };

  // Start analysis for selected repository
  const handleStartAnalysis = async () => {
    if (!selectedRepo) return;
    
    setAnalysisInProgress(true);
    await startAnalysis({
      repo_path: selectedRepo.path,
      recursive: true,
      skip_confirmation: true
    });
    setAnalysisInProgress(false);
    // Navigate to jobs tab
    setActiveTab('jobs');
  };

  return (
    <div className="space-y-6">
      {/* Directory Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Folder className="mr-2 h-5 w-5 text-blue-500" />
          Select Directory
        </h2>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter directory path to search for repositories..."
                value={currentPath}
                onChange={handlePathChange}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsDirectoryBrowserOpen(true)}
            >
              Browse
            </Button>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Depth
              </label>
              <select
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2"
                value={repoDepth}
                onChange={(e) => setRepoDepth(Number(e.target.value))}
              >
                <option value={1}>1 level (current directory only)</option>
                <option value={2}>2 levels</option>
                <option value={3}>3 levels</option>
                <option value={4}>4 levels (deeper search)</option>
              </select>
            </div>
            
            <Button
              className="mt-6"
              onClick={handleDiscoverRepos}
              disabled={!currentPath || isLoadingRepositories}
            >
              {isLoadingRepositories ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <GitBranch className="h-4 w-4 mr-2" />
              )}
              Discover Repositories
            </Button>
          </div>
        </div>
      </div>

      {/* Discovered Repositories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <GitBranch className="mr-2 h-5 w-5 text-blue-500" />
            Discovered Repositories
          </h2>
          
          {repositories.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearRepositories()}
            >
              Clear
            </Button>
          )}
        </div>

        {repositoriesError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded mb-4 text-red-600 dark:text-red-400">
            {repositoriesError}
          </div>
        )}

        {isLoadingRepositories ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <div className="ml-4">
              <h3 className="font-medium">Discovering Repositories</h3>
              <p className="text-sm text-gray-500">This might take a moment for large directories...</p>
            </div>
          </div>
        ) : repositories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-md">
            No repositories discovered yet. Select a directory and click "Discover Repositories".
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b">
              <h3 className="font-medium">Found {repositories.length} repositories</h3>
            </div>
            
            <div className="divide-y">
              {repositories.map((repo) => (
                <div
                  key={repo.path}
                  className={`px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedRepo?.path === repo.path ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedRepo(repo)}
                >
                  <div className="flex items-center">
                    <GitBranch className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{getRepoNameFromPath(repo.name)}</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400 block truncate max-w-md">{repo.path}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-2 py-1">
                      Git Repository
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedRepo && (
          <div className="mt-6 p-4 border rounded-md bg-blue-50 dark:bg-blue-900/10">
            <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-2">Selected Repository</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                <span className="ml-2 font-medium">{getRepoNameFromPath(selectedRepo.name)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Path:</span>
                <span className="ml-2 font-mono text-sm">{selectedRepo.path}</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleStartAnalysis}
              disabled={analysisInProgress}
            >
              {analysisInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Start Analysis
            </Button>
          </div>
        )}
      </div>

      {/* Directory Browser Dialog */}
      <Dialog open={isDirectoryBrowserOpen} onOpenChange={setIsDirectoryBrowserOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Browse Directories</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <DirectoryBrowser
              initialPath={currentPath}
              onSelectDirectory={handleDirectorySelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepoDiscovery;