// analyzer_webui/components/repository/RepositoryForm.tsx
import React, { useState, useEffect } from 'react';
import { Repository } from '@/types';
import { useRepositoryStore } from '@/store/useRepositoryStore';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import RepositoryTags from './RepositoryTags';
import DirectoryBrowser from '../DirectoryBrowser';

interface RepositoryFormProps {
  repository?: Repository;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (repository: Repository) => void;
}

const RepositoryForm: React.FC<RepositoryFormProps> = ({
  repository,
  isOpen,
  onClose,
  onSuccess
}) => {
  const isEditing = !!repository;
  const { createRepository, updateRepository } = useRepositoryStore();
  
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    relative_path: '',
    tags: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDirectoryBrowser, setShowDirectoryBrowser] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Initialize form when repository changes
  useEffect(() => {
    if (repository) {
      setFormData({
        name: repository.name,
        path: repository.path,
        relative_path: repository.relative_path,
        tags: repository.tags?.split(',').map(t => t.trim()).filter(Boolean) || []
      });
    } else {
      setFormData({
        name: '',
        path: '',
        relative_path: '',
        tags: []
      });
    }
  }, [repository, isOpen]);
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Repository name is required';
    }
    
    if (!formData.path.trim()) {
      errors.path = 'Repository path is required';
    }
    
    if (!formData.relative_path.trim()) {
      errors.relative_path = 'Relative path is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && repository) {
        // Update existing repository
        const updatedRepo = await updateRepository(repository.id, {
          ...repository,
          name: formData.name,
          path: formData.path,
          relative_path: formData.relative_path,
          tags: formData.tags.join(',')
        });
        
        if (updatedRepo && onSuccess) {
          onSuccess(updatedRepo);
        }
      } else {
        // Create new repository
        const newRepo = await createRepository({
          name: formData.name,
          path: formData.path,
          relative_path: formData.relative_path,
          tags: formData.tags.join(',')
        });
        
        if (newRepo && onSuccess) {
          onSuccess(newRepo);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Repository form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSelectDirectory = (path: string) => {
    // Get repository name from path (last segment)
    const pathParts = path.split('/');
    const name = pathParts[pathParts.length - 1];
    
    // Calculate relative path (could be enhanced to use a base path)
    const relative_path = path;
    
    setFormData({
      ...formData,
      name,
      path,
      relative_path
    });
    
    setShowDirectoryBrowser(false);
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Repository' : 'Add New Repository'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update repository details' 
                : 'Add a new repository to your collection'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <FormLabel htmlFor="repo-name">Repository Name</FormLabel>
              <Input
                id="repo-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Repository name"
                className={validationErrors.name ? 'border-red-500' : ''}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500">{validationErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <FormLabel htmlFor="repo-path">Repository Path</FormLabel>
              <div className="flex gap-2">
                <Input
                  id="repo-path"
                  value={formData.path}
                  onChange={(e) => setFormData({...formData, path: e.target.value})}
                  placeholder="Full path to repository"
                  className={`flex-1 ${validationErrors.path ? 'border-red-500' : ''}`}
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowDirectoryBrowser(true)}
                >
                  Browse
                </Button>
              </div>
              {validationErrors.path && (
                <p className="text-xs text-red-500">{validationErrors.path}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <FormLabel htmlFor="relative-path">Relative Path</FormLabel>
              <Input
                id="relative-path"
                value={formData.relative_path}
                onChange={(e) => setFormData({...formData, relative_path: e.target.value})}
                placeholder="Relative path"
                className={validationErrors.relative_path ? 'border-red-500' : ''}
              />
              {validationErrors.relative_path && (
                <p className="text-xs text-red-500">{validationErrors.relative_path}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <RepositoryTags
                tags={formData.tags}
                onTagsChange={(tags) => setFormData({...formData, tags})}
              />
              <p className="text-xs text-gray-500">
                Add tags to help organize your repositories
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Repository' : 'Create Repository'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Directory Browser Dialog */}
      <Dialog open={showDirectoryBrowser} onOpenChange={setShowDirectoryBrowser}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Browse Directories</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <DirectoryBrowser
              initialPath={formData.path || "~/"}
              onSelectDirectory={handleSelectDirectory}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RepositoryForm;