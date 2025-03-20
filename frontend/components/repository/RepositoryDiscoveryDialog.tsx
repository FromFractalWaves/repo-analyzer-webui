// components/repository/RepositoryDiscoveryDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { useRepositoryStore } from '@/store/useRepositoryStore';
import { Repository } from '@/types';
import { FolderGit, Loader2, FolderOpen, RefreshCw } from 'lucide-react'; // Added RefreshCw here
import DirectorySelectionDialog from './DirectorySelectionDialog';


interface RepositoryDiscoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRepository: (repo: Repository) => void;
}

const RepositoryDiscoveryDialog: React.FC<RepositoryDiscoveryDialogProps> = ({
  isOpen,
  onClose,
  onAddRepository
}) => {
  const [currentDirectory, setCurrentDirectory] = useState<string>('~/');
  const [discoveredRepos, setDiscoveredRepos] = useState<Repository[]>([]);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [selectedRepos, setSelectedRepos] = useState<Record<string, boolean>>({});
  const [showDirectorySelector, setShowDirectorySelector] = useState<boolean>(false);
  
  const { createRepository } = useRepositoryStore();
  
  // Start discovery on open
  useEffect(() => {
    if (isOpen) {
      handleDiscoverRepositories();
    }
  }, [isOpen]);
  
  // Discover repositories in directory
  const handleDiscoverRepositories = async () => {
    if (!currentDirectory) return;
    
    setIsDiscovering(true);
    try {
      const result = await apiService.discoverRepositories(currentDirectory);
      if (result.data) {
        setDiscoveredRepos(result.data);
        // Reset selection
        setSelectedRepos({});
      }
    } catch (error) {
      console.error('Error discovering repositories:', error);
    } finally {
      setIsDiscovering(false);
    }
  };
  
  // Add selected repositories
  const handleAddRepositories = async () => {
    const selectedRepoKeys = Object.keys(selectedRepos).filter(key => selectedRepos[key]);
    if (selectedRepoKeys.length === 0) return;
    
    try {
      // Get the first selected repo
      const firstSelectedPath = selectedRepoKeys[0];
      const firstRepo = discoveredRepos.find(r => r.path === firstSelectedPath);
      
      // Add all selected repos
      for (const repoPath of selectedRepoKeys) {
        const repo = discoveredRepos.find(r => r.path === repoPath);
        if (repo) {
          await createRepository({
            name: repo.name,
            path: repo.path,
            relative_path: repo.relative_path
          });
        }
      }
      
      // If we found the first repo, select it in the parent component
      if (firstRepo) {
        const newRepo = await createRepository({
          name: firstRepo.name,
          path: firstRepo.path,
          relative_path: firstRepo.relative_path
        });
        
        if (newRepo) {
          onAddRepository(newRepo);
        }
      }
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error("Failed to add repositories:", error);
    }
  };
  
  // Toggle repo selection
  const toggleRepoSelection = (repoPath: string) => {
    setSelectedRepos(prev => ({
      ...prev,
      [repoPath]: !prev[repoPath]
    }));
  };
  
  // Select/deselect all repos
  const toggleSelectAll = () => {
    const allSelected = discoveredRepos.every(repo => selectedRepos[repo.path]);
    
    if (allSelected) {
      setSelectedRepos({});
    } else {
      const newSelection: Record<string, boolean> = {};
      discoveredRepos.forEach(repo => {
        newSelection[repo.path] = true;
      });
      setSelectedRepos(newSelection);
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Discover Git Repositories</DialogTitle>
            <DialogDescription>
              Find and add Git repositories from your filesystem
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {/* Directory selection */}
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-medium">Current directory:</label>
                <p className="text-sm text-gray-600 font-mono">{currentDirectory}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDirectorySelector(true)}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Change Directory
              </Button>
            </div>
            
            {/* Repository list */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium flex items-center">
                  {isDiscovering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Scanning...
                    </>
                  ) : (
                    `Found ${discoveredRepos.length} repositories`
                  )}
                </h3>
                
                <div className="flex gap-2">
                  {discoveredRepos.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={toggleSelectAll}
                    >
                      {discoveredRepos.every(repo => selectedRepos[repo.path]) ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={handleDiscoverRepositories}
                    disabled={isDiscovering}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </div>
              </div>
              
              {isDiscovering ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                  <p>Scanning {currentDirectory} for repositories...</p>
                </div>
              ) : discoveredRepos.length > 0 ? (
                <div className="border rounded-md overflow-y-auto max-h-64">
                  {discoveredRepos.map((repo) => (
                    <div 
                      key={repo.path} 
                      className={`flex items-center p-3 border-b last:border-b-0 hover:bg-gray-50 ${selectedRepos[repo.path] ? 'bg-blue-50' : ''}`}
                      onClick={() => toggleRepoSelection(repo.path)}
                    >
                      <div className="mr-3">
                        <input 
                          type="checkbox" 
                          checked={!!selectedRepos[repo.path]} 
                          onChange={() => {}} // Handled by div click
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{repo.name}</h4>
                        <p className="text-sm text-gray-500 font-mono truncate">{repo.path}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed rounded-md">
                  <FolderGit className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium mb-1">No repositories found</h3>
                  <p className="text-sm text-gray-500">
                    Try scanning a different directory
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddRepositories}
              disabled={Object.keys(selectedRepos).filter(key => selectedRepos[key]).length === 0}
            >
              Add Selected Repositories
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Directory Selection Dialog */}
      <DirectorySelectionDialog
        isOpen={showDirectorySelector}
        onClose={() => setShowDirectorySelector(false)}
        currentDirectory={currentDirectory}
        onSelectDirectory={(directory) => {
          setCurrentDirectory(directory);
          setShowDirectorySelector(false);
          // Auto scan when directory changes
          setIsDiscovering(true);
          setTimeout(() => {
            handleDiscoverRepositories();
          }, 100);
        }}
      />
    </>
  );
};

export default RepositoryDiscoveryDialog;