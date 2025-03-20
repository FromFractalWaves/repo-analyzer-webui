// store/useRepositoryStore.ts
import { create } from 'zustand';
import { Repository, RepositoryFilter, RepositorySearchParams } from '@/types';
import { apiService } from '@/services/api';

interface RepositoryState {
  // State
  repositories: Repository[];
  filteredRepositories: Repository[];
  selectedRepository: Repository | null;
  loading: boolean;
  error: string | null;
  searchParams: RepositorySearchParams;
  
  // Actions
  fetchRepositories: (filter?: RepositoryFilter) => Promise<void>;
  getRepository: (id: string) => Promise<Repository | null>;
  createRepository: (repository: Omit<Repository, 'id'>) => Promise<Repository | null>;
  updateRepository: (id: string, repository: Partial<Repository>) => Promise<Repository | null>;
  deleteRepository: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<Repository | null>;
  
  // Selectors
  setSelectedRepository: (repository: Repository | null) => void;
  setSearchParams: (params: Partial<RepositorySearchParams>) => void;
  getRepositoryTags: () => Promise<string[]>;
  
  // Filtering and search
  applyFilters: () => void;
  searchRepositories: (query: string, limit?: number) => Promise<Repository[]>;
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repositories: [],
  filteredRepositories: [],
  selectedRepository: null,
  loading: false,
  error: null,
  searchParams: {
    sortBy: 'lastAccessed',
    sortOrder: 'desc'
  },
  
  // Fetch repositories with optional filtering
  fetchRepositories: async (filter?: RepositoryFilter) => {
    set({ loading: true, error: null });
    try {
      // Convert frontend search params to backend filter format if needed
      const backendFilter: RepositoryFilter | undefined = filter ?? (() => {
        const { searchParams } = get();
        if (!searchParams.search && searchParams.isFavorite === undefined && 
            (!searchParams.tags || searchParams.tags.length === 0) &&
            !searchParams.sortBy) {
          return undefined;
        }
        
        return {
          search: searchParams.search,
          is_favorite: searchParams.isFavorite,
          tags: searchParams.tags,
          sort_by: searchParams.sortBy,
          sort_order: searchParams.sortOrder
        };
      })();
      
      const result = await apiService.getRepositories(backendFilter);
      if (result.error) {
        set({ error: result.error, loading: false });
        return;
      }
      
      set({ 
        repositories: result.data || [], 
        filteredRepositories: result.data || [],
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch repositories', 
        loading: false 
      });
    }
  },
  
  // Get a single repository by ID
  getRepository: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const result = await apiService.getRepository(id);
      if (result.error) {
        set({ error: result.error, loading: false });
        return null;
      }
      
      // Update the repository in the local cache if it exists
      if (result.data) {
        set(state => ({
          repositories: state.repositories.map(repo => 
            repo.id === id ? result.data! : repo
          )
        }));
        get().applyFilters();
      }
      
      set({ loading: false });
      return result.data || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch repository', 
        loading: false 
      });
      return null;
    }
  },
  
  // Create a new repository
  createRepository: async (repository) => {
    set({ loading: true, error: null });
    try {
      // Generate a temporary ID (will be replaced by server-generated ID)
      const tempRepo: Repository = {
        ...repository,
        id: crypto.randomUUID(),
        is_favorite: false
      };
      
      const result = await apiService.createRepository(tempRepo);
      
      if (result.error) {
        set({ error: result.error, loading: false });
        return null;
      }
      
      // Add to local state
      if (result.data) {
        set(state => ({ 
          repositories: [...state.repositories, result.data!]
        }));
        get().applyFilters();
      }
      
      set({ loading: false });
      return result.data || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create repository', 
        loading: false 
      });
      return null;
    }
  },
  
  // Update an existing repository
  updateRepository: async (id, repository) => {
    set({ loading: true, error: null });
    try {
      // Get existing repo first to merge with updates
      const existingRepo = get().repositories.find(repo => repo.id === id);
      if (!existingRepo) {
        set({ error: 'Repository not found', loading: false });
        return null;
      }
      
      const updatedRepo = { ...existingRepo, ...repository, id };
      const result = await apiService.updateRepository(id, updatedRepo);
      if (result.error) {
        set({ error: result.error, loading: false });
        return null;
      }
      
      // Update local state
      if (result.data) {
        set(state => ({
          repositories: state.repositories.map(repo => 
            repo.id === id ? result.data! : repo
          ),
          selectedRepository: state.selectedRepository?.id === id 
            ? result.data 
            : state.selectedRepository
        }));
        get().applyFilters();
      }
      
      set({ loading: false });
      return result.data || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update repository', 
        loading: false 
      });
      return null;
    }
  },
  
  // Delete a repository
  deleteRepository: async (id) => {
    set({ loading: true, error: null });
    try {
      const result = await apiService.deleteRepository(id);
      if (result.error) {
        set({ error: result.error, loading: false });
        return false;
      }
      
      // Update local state
      set(state => ({
        repositories: state.repositories.filter(repo => repo.id !== id),
        selectedRepository: state.selectedRepository?.id === id 
          ? null 
          : state.selectedRepository
      }));
      get().applyFilters();
      
      set({ loading: false });
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete repository', 
        loading: false 
      });
      return false;
    }
  },
  
  // Toggle favorite status
  toggleFavorite: async (id, isFavorite) => {
    set({ loading: true, error: null });
    try {
      const result = await apiService.toggleRepositoryFavorite(id, isFavorite);
      if (result.error) {
        set({ error: result.error, loading: false });
        return null;
      }
      
      // Update local state
      if (result.data) {
        set(state => ({
          repositories: state.repositories.map(repo => 
            repo.id === id ? { ...repo, is_favorite: isFavorite } : repo
          ),
          selectedRepository: state.selectedRepository?.id === id 
            ? { ...state.selectedRepository, is_favorite: isFavorite } 
            : state.selectedRepository
        }));
        get().applyFilters();
      }
      
      set({ loading: false });
      return result.data || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update favorite status', 
        loading: false 
      });
      return null;
    }
  },
  
  // Set selected repository
  setSelectedRepository: (repository) => {
    set({ selectedRepository: repository });
  },
  
  // Update search params
  setSearchParams: (params) => {
    set(state => ({ 
      searchParams: { ...state.searchParams, ...params } 
    }));
    // If we're using client-side filtering, apply the filter
    if (get().repositories.length > 0) {
      get().applyFilters();
    } else {
      // Otherwise fetch with the new filters
      get().fetchRepositories();
    }
  },
  
  // Get all repository tags
  getRepositoryTags: async () => {
    try {
      const result = await apiService.getRepositoryTags();
      if (result.error || !result.data) {
        return [];
      }
      return result.data;
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      return [];
    }
  },
  
  // Apply filters and sorting based on search params
  applyFilters: () => {
    const { repositories, searchParams } = get();
    
    let filtered = [...repositories];
    
    // Filter by favorite status
    if (searchParams.isFavorite !== undefined) {
      filtered = filtered.filter(repo => repo.is_favorite === searchParams.isFavorite);
    }
    
    // Filter by tags
    if (searchParams.tags && searchParams.tags.length > 0) {
      filtered = filtered.filter(repo => {
        if (!repo.tags) return false;
        const repoTags = repo.tags.split(',').map(tag => tag.trim().toLowerCase());
        return searchParams.tags!.some(tag => 
          repoTags.includes(tag.toLowerCase())
        );
      });
    }
    
    // Filter by search text
    if (searchParams.search) {
      const searchLower = searchParams.search.toLowerCase();
      filtered = filtered.filter(repo => 
        repo.name.toLowerCase().includes(searchLower) || 
        repo.path.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    if (searchParams.sortBy) {
      filtered.sort((a, b) => {
        let valueA, valueB;
        
        // Get values based on sort field
        switch(searchParams.sortBy) {
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'lastAccessed':
            valueA = a.last_accessed || '';
            valueB = b.last_accessed || '';
            break;
          case 'lastCommitDate':
            valueA = a.last_commit_date || '';
            valueB = b.last_commit_date || '';
            break;
          default:
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
        }
        
        // Sort direction
        const direction = searchParams.sortOrder === 'asc' ? 1 : -1;
        
        // Handle string comparison
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return direction * valueA.localeCompare(valueB);
        }
        
        // Handle number comparison
        return direction * (Number(valueA) - Number(valueB));
      });
    }
    
    set({ filteredRepositories: filtered });
  },
  
  // Search repositories
  searchRepositories: async (query, limit = 10) => {
    try {
      const result = await apiService.searchRepositories(query, limit);
      return result.data || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }
}));