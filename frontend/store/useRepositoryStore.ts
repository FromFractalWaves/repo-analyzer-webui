// analyzer_webui/store/useRepositoryStore.ts
import { create } from 'zustand';
import { Repository, RepositorySearchParams } from '@/types';
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
  fetchRepositories: () => Promise<void>;
  getRepository: (id: string) => Promise<Repository | null>;
  createRepository: (repository: Omit<Repository, 'id' | 'is_favorite'>) => Promise<Repository | null>;
  updateRepository: (id: string, repository: Partial<Repository>) => Promise<Repository | null>;
  deleteRepository: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<Repository | null>;
  
  // Selectors
  setSelectedRepository: (repository: Repository | null) => void;
  setSearchParams: (params: Partial<RepositorySearchParams>) => void;
  getRepositoryTags: () => Promise<string[]>;
  
  // Filtering and search
  applyFilters: () => void;
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
  
  // Fetch all repositories
  fetchRepositories: async () => {
    set({ loading: true, error: null });
    try {
      const result = await apiService.getRepositories();
      if (result.error) {
        set({ error: result.error, loading: false });
        return;
      }
      set({ 
        repositories: result.data || [], 
        loading: false 
      });
      get().applyFilters();
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
      return result.data || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch repository', 
        loading: false 
      });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  createRepository: async (repository) => {
    set({ loading: true, error: null });
    try {
      const result = await apiService.createRepository({
        ...repository,
        id: '', // Will be assigned by the server
        is_favorite: false
      });
      
      if (result.error) {
        console.error("Error creating repository:", result.error);
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
      console.error("Exception in createRepository:", error);
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
      
      return result.data || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update repository', 
        loading: false 
      });
      return null;
    } finally {
      set({ loading: false });
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
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete repository', 
        loading: false 
      });
      return false;
    } finally {
      set({ loading: false });
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
      
      return result.data || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update favorite status', 
        loading: false 
      });
      return null;
    } finally {
      set({ loading: false });
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
    get().applyFilters();
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
  }
}));