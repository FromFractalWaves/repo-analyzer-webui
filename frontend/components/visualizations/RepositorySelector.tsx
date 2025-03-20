// components/visualizations/RepositorySelector.tsx
import React from 'react';
import { GitBranch, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface RepositorySelectorProps {
  repositories: string[];
  selectedRepository: string | null;
  onRepositoryChange: (repository: string | null) => void;
  className?: string;
}

const RepositorySelector: React.FC<RepositorySelectorProps> = ({
  repositories,
  selectedRepository,
  onRepositoryChange,
  className
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Filter repositories based on search query
  const filteredRepositories = repositories.filter(repo => 
    repo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center min-w-[200px] justify-between">
            <div className="flex items-center truncate">
              <GitBranch className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">
                {selectedRepository || 'All Repositories'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 ml-2 opacity-70 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          <DropdownMenuLabel>Select Repository</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Search input */}
          <div className="px-2 py-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search repositories..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          
          {/* All repositories option */}
          <DropdownMenuCheckboxItem
            checked={selectedRepository === null}
            onCheckedChange={() => onRepositoryChange(null)}
          >
            <span className="font-medium">All Repositories</span>
          </DropdownMenuCheckboxItem>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredRepositories.length === 0 ? (
              <div className="px-2 py-4 text-sm text-gray-500 text-center">
                No repositories match your search
              </div>
            ) : (
              filteredRepositories.map(repo => (
                <DropdownMenuCheckboxItem
                  key={repo}
                  checked={selectedRepository === repo}
                  onCheckedChange={() => onRepositoryChange(repo)}
                >
                  {repo}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default RepositorySelector;