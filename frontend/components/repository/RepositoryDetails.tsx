// analyzer_webui/components/repository/RepositoryDetails.tsx
import React, { useState } from 'react';
import { Repository, AnalysisRequest } from '@/types';
import { useRepositoryStore } from '@/store/useRepositoryStore';
import { useStore } from '@/store';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Star, 
  Trash, 
  GitBranch, 
  Clock,
  Calendar,
  Edit,
  Save,
  FolderGit,
  X,
  PlayCircle,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/utils';
import RepositoryTags from './RepositoryTags';

interface RepositoryDetailsProps {
  repository: Repository;
  onClose?: () => void;
}

const RepositoryDetails: React.FC<RepositoryDetailsProps> = ({ 
  repository,
  onClose 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRepo, setEditedRepo] = useState<Repository>({...repository});
  const { 
    toggleFavorite, 
    deleteRepository, 
    updateRepository 
  } = useRepositoryStore();
  const { startAnalysis } = useStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    
    const request: AnalysisRequest = {
      repo_path: repository.path,
      recursive: true,
      skip_confirmation: true,
      repo_id: repository.id
    };
    
    await startAnalysis(request);
    setIsAnalyzing(false);
  };
  
  const handleToggleFavorite = async () => {
    await toggleFavorite(repository.id, !repository.is_favorite);
  };
  
  const handleSaveChanges = async () => {
    await updateRepository(repository.id, editedRepo);
    setIsEditing(false);
  };
  
  const handleTagsChange = (tags: string[]) => {
    setEditedRepo({
      ...editedRepo,
      tags: tags.join(',')
    });
  };
  
  const hasBeenAnalyzed = !!repository.last_analysis_job_id;
  
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          {isEditing ? (
            <Input
              value={editedRepo.name}
              onChange={(e) => setEditedRepo({...editedRepo, name: e.target.value})}
              className="text-lg font-medium h-8 mb-1"
            />
          ) : (
            <CardTitle className="text-lg flex items-center">
              <FolderGit className="h-4 w-4 mr-2 text-blue-500" />
              {repository.name}
            </CardTitle>
          )}
          <CardDescription>
            {repository.path}
          </CardDescription>
        </div>
        
        <div className="flex">
          {isEditing ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(false)}
                className="h-8 mr-2"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSaveChanges}
                className="h-8"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 ml-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="space-y-4">
          {/* Repository metadata */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {repository.last_commit_date && (
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                <span>Last commit: {formatDate(repository.last_commit_date)}</span>
              </div>
            )}
            
            {repository.last_accessed && (
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                <span>Last accessed: {formatDate(repository.last_accessed)}</span>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Tags</h4>
            {isEditing ? (
              <RepositoryTags 
                tags={editedRepo.tags?.split(',').map(t => t.trim()).filter(Boolean) || []}
                onTagsChange={handleTagsChange}
              />
            ) : (
              <RepositoryTags 
                tags={repository.tags?.split(',').map(t => t.trim()).filter(Boolean) || []}
                onTagsChange={() => {}}
                readOnly
              />
            )}
          </div>
          
          {hasBeenAnalyzed && (
            <div>
              <h4 className="text-sm font-medium mb-1">Analysis Status</h4>
              <div className="flex items-center">
                <GitBranch className="h-4 w-4 mr-1 text-green-500" />
                <span className="text-sm text-green-600">
                  Previously analyzed
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <div className="flex space-x-2 w-full justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFavorite}
            className="flex-1"
          >
            <Star 
              className={`h-4 w-4 mr-1 ${repository.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} 
            />
            {repository.is_favorite ? 'Starred' : 'Star'}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteRepository(repository.id)}
            className="flex-1"
          >
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
        
        <Button 
          className="w-full"
          onClick={handleStartAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting Analysis...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4 mr-2" />
              {hasBeenAnalyzed ? 'Analyze Again' : 'Start Analysis'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RepositoryDetails;