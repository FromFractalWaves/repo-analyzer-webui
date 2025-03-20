// components/repository/EnhancedRepositoryDiscovery.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { CommandManager } from '@/components/command-manager/CommandManager';
import { createRepositoryCommandPlugin } from '@/components/command-manager/plugins/repositoryCommandPlugin';
import { Repository } from '@/types';
import { useRepositoryStore } from '@/store/useRepositoryStore';
import { useAppContext } from '@/context/AppContext';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FolderGit, 
  Search, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import RepositoryDetails from './RepositoryDetails';
import RepositoryDiscoveryDialog from './RepositoryDiscoveryDialog';

const EnhancedRepositoryDiscovery: React.FC = () => {
  // State
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [showDiscoveryDialog, setShowDiscoveryDialog] = useState<boolean>(false);
  
  // Repository store for saved repositories
  const { 
    fetchRepositories,
    repositories,
    loading,
    error,
  } = useRepositoryStore();

  // AppContext for integration with the broader app
  const {
    startAnalysis,
    setActiveTab: setAppActiveTab
  } = useAppContext();
  
  // Initialize - fetch repositories on component mount
  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);
  
  // Handle repository selection
  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo);
  };
  
  // Start analysis for the selected repository
  const handleStartAnalysis = async () => {
    if (!selectedRepo) return;
    
    try {
      await startAnalysis({
        repo_path: selectedRepo.path,
        recursive: true,
        skip_confirmation: true,
        repo_id: selectedRepo.id
      });
      
      // Navigate to jobs tab in the main app
      setAppActiveTab('jobs');
    } catch (error) {
      console.error("Failed to start analysis:", error);
    }
  };
  
  // Create repository command plugin for search/filter functionality
  const repositoryPlugin = createRepositoryCommandPlugin({
    repositories,
    loading,
    onSelect: handleSelectRepo
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderGit className="h-5 w-5 mr-2 text-blue-500" />
            Repository Management
          </CardTitle>
          <CardDescription>
            Browse, manage, and analyze git repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Your Repositories</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchRepositories()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="sr-only">Refresh</span>
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowDiscoveryDialog(true)}
              >
                <Search className="h-4 w-4 mr-1" />
                Discover Repos
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CommandManager plugins={[repositoryPlugin]} className="w-full" />
              
              {/* Error state */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
                  <p>{error}</p>
                </div>
              )}
              
              {/* Empty state */}
              {!loading && repositories.length === 0 && !error && (
                <div className="mt-4 p-4 text-center">
                  <FolderGit className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <h3 className="font-medium">No repositories found</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">
                    Add your first repository to get started
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDiscoveryDialog(true)}
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Discover Repositories
                  </Button>
                </div>
              )}
            </div>
            
            {/* Repository details */}
            <div>
              {selectedRepo && (
                <div className="space-y-4">
                  <RepositoryDetails 
                    repository={selectedRepo}
                    onClose={() => setSelectedRepo(null)}
                  />
                  
                  {/* Add analysis button */}
                  <Button 
                    className="w-full" 
                    onClick={handleStartAnalysis}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Analyze Repository
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Repository Discovery Dialog */}
      <RepositoryDiscoveryDialog
        isOpen={showDiscoveryDialog}
        onClose={() => setShowDiscoveryDialog(false)}
        onAddRepository={(repo) => {
          setSelectedRepo(repo);
        }}
      />
    </div>
  );
};

export default EnhancedRepositoryDiscovery;