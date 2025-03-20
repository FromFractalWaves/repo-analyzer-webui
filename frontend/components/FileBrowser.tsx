// components/FileBrowser.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Folder, FileText, ChevronRight, ChevronDown, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';

interface FileBrowserProps {
  onSelectDirectory: (path: string) => void;
}

interface FileItem {
  name: string;
  path: string;
  type: 'directory' | 'file';
  size?: number;
  modified?: number;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ onSelectDirectory }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [items, setItems] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load directory contents
  const loadDirectory = async (path: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.browseDirectory(path);
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setItems(result.data.contents);
        setCurrentPath(result.data.current_dir);
        setParentPath(result.data.parent_dir);
      }
    } catch (err) {
      setError('Failed to load directory');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with home directory on mount
  useEffect(() => {
    loadDirectory('');
  }, []);

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

  // Handle directory selection for repository analysis
  const handleSelectDirectory = () => {
    onSelectDirectory(currentPath);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleParentClick}
            disabled={parentPath === null || isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="font-mono text-sm truncate max-w-md">
            {currentPath || 'Home Directory'}
          </div>
        </div>
        
        <Button 
          size="sm" 
          onClick={handleSelectDirectory}
        >
          Select Directory
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded mb-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="border rounded overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
            <span>Loading...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            This directory is empty
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.path}
                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 flex items-center"
                onClick={() => handleItemClick(item)}
              >
                {item.type === 'directory' ? (
                  <Folder className="h-5 w-5 text-blue-500 mr-3" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-500 mr-3" />
                )}
                <span className="flex-1 truncate">{item.name}</span>
                {item.type === 'directory' && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileBrowser;