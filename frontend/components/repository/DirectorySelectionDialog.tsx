// components/repository/DirectorySelectionDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DirectoryBrowser from '../DirectoryBrowser';

interface DirectorySelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentDirectory: string;
  onSelectDirectory: (directory: string) => void;
}

const DirectorySelectionDialog: React.FC<DirectorySelectionDialogProps> = ({
  isOpen,
  onClose,
  currentDirectory,
  onSelectDirectory
}) => {
  const [selectedDirectory, setSelectedDirectory] = useState<string>(currentDirectory);
  
  // Reset selected directory when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDirectory(currentDirectory);
    }
  }, [isOpen, currentDirectory]);
  
  return (
    <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Select Directory</DialogTitle>
        </DialogHeader>
        
        <div className="my-4">
          <DirectoryBrowser
            initialPath={selectedDirectory}
            onSelectDirectory={setSelectedDirectory}
            className="w-full"
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSelectDirectory(selectedDirectory)}
          >
            Select Directory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DirectorySelectionDialog;