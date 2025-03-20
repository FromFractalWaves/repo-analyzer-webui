// analyzer_webui/components/repository/RepositoryTags.tsx
import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';

interface RepositoryTagsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  readOnly?: boolean;
  className?: string;
}

const RepositoryTags: React.FC<RepositoryTagsProps> = ({
  tags = [],
  onTagsChange,
  readOnly = false,
  className
}) => {
  const [newTag, setNewTag] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    // Skip if tag already exists (case insensitive)
    if (tags.some(t => t.toLowerCase() === newTag.trim().toLowerCase())) {
      setNewTag('');
      return;
    }
    
    // Add the new tag
    const updatedTags = [...tags, newTag.trim()];
    onTagsChange(updatedTags);
    setNewTag('');
    setIsOpen(false);
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    onTagsChange(updatedTags);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map(tag => (
        <Badge 
          key={tag} 
          variant="secondary"
          className="flex items-center"
        >
          <Tag className="h-3 w-3 mr-1" />
          {tag}
          {!readOnly && (
            <button 
              onClick={() => handleRemoveTag(tag)} 
              className="ml-1 text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      
      {!readOnly && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 px-2 rounded-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-2">
            <div className="flex gap-2">
              <Input
                placeholder="New tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8"
              />
              <Button 
                size="sm" 
                onClick={handleAddTag} 
                className="h-8"
              >
                Add
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default RepositoryTags;