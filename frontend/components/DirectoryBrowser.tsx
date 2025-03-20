// components/DirectoryBrowser.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Folder, FileText, ChevronRight, ArrowLeft, Home, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiService } from '@/services/api';

interface DirectoryBrowserProps {
  initialPath?: string;
  onSelectDirectory: (path: string) => void;
  className?: string;
}

interface FileItem {
  name: string;
  path: string;
  type: 'directory' | 'file';
  size?: number;
  modified?: number;
}

const DirectoryBrowser: React.FC<DirectoryBrowserProps> = ({
  initialPath = '',
  onSelectDirectory,
  className = ''
}) => {
  // State for tracking current directory navigation
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [dirContents, setDirContents] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [customPath, setCustomPath] = useState<string>(initialPath);

  // Load directory contents
  const loadDirectory = async (path: string, addToHistory = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.browseDirectory(path);
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        // Ensure data is available before accessing properties
        const contents = result.data.contents || [];
        const currentDir = result.data.current_dir || path;
        
        setDirContents(contents);
        setCurrentPath(currentDir);
        setParentPath(result.data.parent_dir);
        setCustomPath(currentDir);
        
        // Update navigation history
        if (addToHistory) {
          // If we're navigating from a point in history, trim the future history
          if (historyIndex < navigationHistory.length - 1) {
            setNavigationHistory(prev => [...prev.slice(0, historyIndex + 1), currentDir]);
          } else {
            setNavigationHistory(prev => [...prev, currentDir]);
          }
          setHistoryIndex(prev => prev + 1);
        }
      }
    } catch (err) {
      setError('Failed to load directory');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with provided path or home directory on mount
  useEffect(() => {
    // Use initialPath if provided, otherwise default to home directory ('~/')
    const startPath = initialPath || '~/';
    loadDirectory(startPath, false);
    setNavigationHistory([startPath]);
    setHistoryIndex(0);
  }, [initialPath]);

  // Handle item selection
  const handleItemClick = (item: FileItem) => {
    if (item.type === 'directory') {
      loadDirectory(item.path);
    }
  };

  // Handle navigation to parent directory
  const handleParentClick = () => {
    if (parentPath !== null) {
      loadDirectory(parentPath);
    }
  };

  // Handle home directory navigation
  const handleHomeClick = () => {
    loadDirectory('~/');
  };

  // Handle history navigation
  const handleHistoryBack = () => {
    if (historyIndex > 0) {
      const prevPath = navigationHistory[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      loadDirectory(prevPath, false);
    }
  };

  // Handle custom path input
  const handleCustomPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPath(e.target.value);
  };

  // Navigate to custom path
  const handleNavigateToCustomPath = () => {
    if (customPath) {
      loadDirectory(customPath);
    }
  };

  // Handle refresh current directory
  const handleRefresh = () => {
    loadDirectory(currentPath, false);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Navigation Tools */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleHistoryBack}
            disabled={historyIndex <= 0 || isLoading}
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHomeClick}
            disabled={isLoading}
            title="Home Directory"
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleParentClick}
            disabled={parentPath === null || isLoading}
            title="Parent Directory"
          >
            <ChevronRight className="h-4 w-4 -rotate-90" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={customPath}
              onChange={handleCustomPathChange}
              placeholder="Enter directory path..."
              onKeyDown={(e) => e.key === 'Enter' && handleNavigateToCustomPath()}
            />
          </div>
          <Button
            onClick={handleNavigateToCustomPath}
            disabled={isLoading}
          >
            Go
          </Button>
        </div>
      </div>

      {/* Current Path Display */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm font-mono overflow-hidden text-ellipsis">
        {currentPath || 'Home Directory'}
      </div>

      {/* Error Display */}
      {error && (
        <div className="m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Directory Contents */}
      <div className="border-t dark:border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
            <span>Loading directory...</span>
          </div>
        ) : dirContents.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            This directory is empty
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {dirContents.map((item) => (
              <div
                key={item.path}
                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-b-0 flex items-center"
                onClick={() => handleItemClick(item)}
              >
                {item.type === 'directory' ? (
                  <Folder className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />
                )}
                <span className="flex-1 truncate">{item.name}</span>
                {item.type === 'directory' && (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t dark:border-gray-700 flex justify-between">
        <Button
          variant="outline"
          onClick={() => onSelectDirectory(currentPath)}
        >
          Select Current Directory
        </Button>
        
        <Button 
          onClick={() => onSelectDirectory(currentPath)}
        >
          Use This Directory
        </Button>
      </div>
    </div>
  );
};

export default DirectoryBrowser;