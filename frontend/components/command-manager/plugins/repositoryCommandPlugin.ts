// analyzer_webui/components/command-manager/plugins/repositoryCommandPlugin.ts
import { CommandPlugin, CommandItem, CommandGroup } from '../types';
import { Repository } from '@/types';
import { GitBranch, Star, Clock, FolderGit } from 'lucide-react';

export interface RepositoryCommandPluginOptions {
  repositories: Repository[];
  loading?: boolean;
  onSelect?: (repo: Repository) => void;
  filter?: (repo: Repository) => boolean;
  searchPlaceholder?: string;
}

export function createRepositoryCommandPlugin({
  repositories,
  loading = false,
  onSelect,
  filter,
  searchPlaceholder = "Search repositories..."
}: RepositoryCommandPluginOptions): CommandPlugin<Repository> {
  return {
    id: 'repositories',
    name: 'Repository Browser',
    description: 'Browse and manage saved repositories',
    icon: FolderGit,
    searchPlaceholder,
    
    // Get repositories (already provided)
    async getItems(): Promise<CommandItem<Repository>[]> {
      if (loading) {
        // Return a temporary loading item
        return [{
          id: 'loading',
          title: 'Loading repositories...',
          description: 'Please wait while repositories are being fetched',
          data: null as any,
          group: 'loading'
        }];
      }
      
      // Convert repositories to command items
      const items: CommandItem<Repository>[] = [];
      
      repositories.forEach(repo => {
        // Apply filter if provided
        if (filter && !filter(repo)) return;
        
        // Determine group based on properties
        let group = 'repositories';
        if (repo.is_favorite) group = 'favorites';
        else if (repo.last_accessed) {
          const lastAccessed = new Date(repo.last_accessed);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff < 7) group = 'recent';
        }
        
        // Create command item
        items.push({
          id: `repo-${repo.id}`,
          title: repo.name,
          description: repo.path,
          icon: repo.is_favorite ? Star : FolderGit,
          data: repo,
          group,
          keywords: [
            repo.name,
            repo.path,
            ...(repo.tags?.split(',').map(t => t.trim()) || [])
          ],
          metadata: {
            tags: repo.tags?.split(',').map(t => t.trim()) || [],
            isFavorite: repo.is_favorite,
            lastAccessed: repo.last_accessed
          }
        });
      });
      
      return items;
    },
    
    // Define groups for organizing repositories
    getGroups(): CommandGroup[] {
      return [
        {
          id: 'favorites',
          title: 'Favorite Repositories',
          icon: Star,
          description: 'Your starred repositories'
        },
        {
          id: 'recent',
          title: 'Recently Used',
          icon: Clock,
          description: 'Repositories you accessed recently'
        },
        {
          id: 'repositories',
          title: 'All Repositories',
          icon: GitBranch,
          description: 'All available repositories'
        },
        {
          id: 'loading',
          title: 'Loading',
          description: 'Loading repositories...'
        }
      ];
    },
    
    // Filter repositories based on search input
    filterItems(items, search) {
      if (!search) return items;
      
      const searchLower = search.toLowerCase();
      
      return items.filter(item => {
        // Skip loading item
        if (item.id === 'loading') return false;
        
        const repo = item.data;
        
        // Check name, path, and tags
        return (
          repo.name.toLowerCase().includes(searchLower) ||
          repo.path.toLowerCase().includes(searchLower) ||
          (repo.tags && repo.tags.toLowerCase().includes(searchLower))
        );
      });
    },
    
    // Handle selection of a repository
    onSelect(item) {
      // Skip if it's the loading item
      if (item.id === 'loading' || !item.data) return;
      
      // Call the provided onSelect handler
      if (onSelect) {
        onSelect(item.data);
      }
    },
    
    emptyStateMessage: "No repositories found",
    loadingMessage: "Loading repositories..."
  };
}