// analyzer_webui/components/repository/EnhancedRepositoryDiscovery.tsx
import React, { useState, useEffect } from 'react';
import { CommandManager } from '@/components/command-manager/CommandManager';
import { createRepositoryCommandPlugin } from '@/components/command-manager/plugins/repositoryCommandPlugin';
import { Repository } from '@/types';
import { useRepositoryStore } from '@/store/useRepositoryStore';
import { apiService } from '@/services/api';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  FolderGit, 
  FilePlus, 
  Search, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import DirectoryBrowser from '../DirectoryBrowser';
import RepositoryDetails from './RepositoryDetails';
import RepositoryForm from './RepositoryForm';

interface EnhancedRepositoryDiscoveryProps {
  className?: string;
}

const EnhancedRepositoryDiscovery: React.FC<EnhancedRepositoryDiscoveryProps> = ({
  className
}) => {
  // State
  const [activeTab, setActiveTab] = useState('saved');
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string>('~/');
  const [discoveredRepos, setDiscoveredRepos] = useState<Repository[]>([]);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  
  // Repository store
  const { 
    fetchRepositories,
    repositories,
    loading,
    error
  } = useRepositoryStore();
  
  // Initialize
  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);
  
  // Handle repository selection
  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo);
  };
  
  // Discover repositories in directory
  const handleDiscoverRepositories = async () => {
    if (!currentDirectory) return;
    
    setIsDiscovering(true);
    try {
      const result = await apiService.discoverRepositories(currentDirectory);
      if (result.data) {
        setDiscoveredRepos(result.data);
      }
    } catch (error) {
      console.error('Error discovering repositories:', error);
    } finally {
      setIsDiscovering(false);
    }
  };
  
  // Add discovered repository to saved list
  const handleAddDiscoveredRepo = async (discoveredRepo: Repository) => {
    const { createRepository } = useRepositoryStore.getState();
    
    // Create the repository
    const newRepo = await createRepository({
      name: discoveredRepo.name,
      path: discoveredRepo.path,
      relative_path: discoveredRepo.relative_path
    });
    
    if (newRepo) {
      // Refresh the repository list
      fetchRepositories();
      
      // Select the newly added repository
      setSelectedRepo(newRepo);
      
      // Switch to the saved tab
      setActiveTab('saved');
    }
  };
  
  // Create repository command plugin
  const repositoryPlugin = createRepositoryCommandPlugin({
    repositories,
    loading,
    onSelect: handleSelectRepo
  });

  return (
    <div className={`space-y-6 ${className}`}>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="saved">Saved Repositories</TabsTrigger>
              <TabsTrigger value="browse">Browse Filesystem</TabsTrigger>
              <TabsTrigger value="discover">Discover Repositories</TabsTrigger>
            </TabsList>
            
            {/* Saved Repositories Tab */}
            <TabsContent value="saved">
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
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                  >
                    <FilePlus className="h-4 w-4 mr-1" />
                    Add Repository
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
                        onClick={() => setShowAddForm(true)}
                      >
                        <FilePlus className="h-4 w-4 mr-1" />
                        Add Repository
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Repository details */}
                <div>
                  {selectedRepo && (
                    <RepositoryDetails 
                      repository={selectedRepo}
                      onClose={() => setSelectedRepo(null)}
                    />
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Browse Filesystem Tab */}
            <TabsContent value="browse">
              <DirectoryBrowser
                initialPath={currentDirectory}
                onSelectDirectory={(path) => setCurrentDirectory(path)}
                className="mb-4"
              />
              
              <div className="flex justify-end">
                <Button
                  onClick={() => setActiveTab('discover')}
                  className="mt-4"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Discover Repositories in this Directory
                </Button>
              </div>
            </TabsContent>
            
            {/* Discover Repositories Tab */}
            <TabsContent value="discover">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-medium">Current Directory</h3>
                  <p className="text-sm text-gray-500 font-mono">{currentDirectory}</p>
                </div>
                <Button
                  onClick={handleDiscoverRepositories}
                  disabled={isDiscovering}
                >
                  {isDiscovering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Discover Repositories
                    </>
                  )}
                </Button>
              </div>
              
              {discoveredRepos.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">Found {discoveredRepos.length} repositories</h3>
                  <div className="border rounded-md overflow-hidden">
                    {discoveredRepos.map((repo) => (
                      <div 
                        key={repo.path} 
                        className="flex justify-between items-center p-3 border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <div>
                          <h4 className="font-medium">{repo.name}</h4>
                          <p className="text-sm text-gray-500 font-mono truncate max-w-md">{repo.path}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddDiscoveredRepo(repo)}
                        >
                          Add to Collection
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !isDiscovering && (
                <div className="p-8 text-center border border-dashed rounded-md">
                  <FolderGit className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium mb-1">No repositories found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Try a different directory or use the browse tab to navigate to a location with git repositories
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('browse')}
                  >
                    Browse Directories
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Repository Form Dialog */}
      <RepositoryForm 
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={(repo) => {
          setSelectedRepo(repo);
          setActiveTab('saved');
        }}
      />
    </div>
  );
};

export default EnhancedRepositoryDiscovery;