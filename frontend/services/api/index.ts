// services/api/index.ts
import { Repository, AnalysisJob, AnalysisData, AnalysisRequest, ApiResponse, RepositoryFilter } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.detail || `Request failed with status ${response.status}`
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }

  // Directory browsing
  async browseDirectory(directory: string): Promise<ApiResponse<{
    current_dir: string;
    parent_dir: string | null;
    contents: Array<{
      name: string;
      path: string;
      type: 'directory' | 'file';
      size?: number;
      modified?: number;
    }>;
  }>> {
    return this.request(`/browse_directory?directory=${encodeURIComponent(directory)}`);
  }

  // Repository discovery
  async discoverRepositories(baseDir: string, depth: number = 2): Promise<ApiResponse<Repository[]>> {
    return this.request<Repository[]>(`/discover_repos?base_dir=${encodeURIComponent(baseDir)}&depth=${depth}`);
  }

  // Repository CRUD operations
  async getRepositories(filter?: RepositoryFilter): Promise<ApiResponse<Repository[]>> {
    let queryString = '';
    
    if (filter) {
      const params = new URLSearchParams();
      if (filter.search) params.append('search', filter.search);
      if (filter.is_favorite !== undefined) params.append('is_favorite', filter.is_favorite.toString());
      if (filter.tags && filter.tags.length > 0) params.append('tags', filter.tags.join(','));
      if (filter.sort_by) params.append('sort_by', filter.sort_by);
      if (filter.sort_order) params.append('sort_order', filter.sort_order);
      
      queryString = `?${params.toString()}`;
    }
    
    return this.request<Repository[]>(`/repositories${queryString}`);
  }

  async getRepository(repoId: string): Promise<ApiResponse<Repository>> {
    return this.request<Repository>(`/repositories/${repoId}`);
  }

  async createRepository(repository: Repository): Promise<ApiResponse<Repository>> {
    return this.request<Repository>('/repositories', {
      method: 'POST',
      body: JSON.stringify(repository),
    });
  }

  async updateRepository(repoId: string, repository: Repository): Promise<ApiResponse<Repository>> {
    return this.request<Repository>(`/repositories/${repoId}`, {
      method: 'PUT',
      body: JSON.stringify(repository),
    });
  }

  async deleteRepository(repoId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/repositories/${repoId}`, {
      method: 'DELETE',
    });
  }

  async getRepositoryTags(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/repositories/tags');
  }

  async toggleRepositoryFavorite(repoId: string, isFavorite: boolean): Promise<ApiResponse<Repository>> {
    return this.request<Repository>(`/repositories/${repoId}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ is_favorite: isFavorite }),
    });
  }

  async batchUpdateRepositories(updates: Array<Partial<Repository> & { id: string }>): Promise<ApiResponse<{ updated: number }>> {
    return this.request<{ updated: number }>('/repositories/batch_update', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  }

  async searchRepositories(query: string, limit: number = 10): Promise<ApiResponse<Repository[]>> {
    return this.request<Repository[]>(`/repositories/search?query=${encodeURIComponent(query)}&limit=${limit}`);
  }

  // Job management
  async getJobs(): Promise<ApiResponse<AnalysisJob[]>> {
    return this.request<AnalysisJob[]>('/jobs');
  }

  async getJob(jobId: string): Promise<ApiResponse<AnalysisJob>> {
    return this.request<AnalysisJob>(`/jobs/${jobId}`);
  }

  async startAnalysis(request: AnalysisRequest): Promise<ApiResponse<AnalysisJob>> {
    return this.request<AnalysisJob>('/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Analysis results
  async getAnalysisData(jobId: string): Promise<ApiResponse<AnalysisData>> {
    return this.request<AnalysisData>(`/jobs/${jobId}/data`);
  }

  async getAnalysisReport(jobId: string): Promise<ApiResponse<{ content: string }>> {
    return this.request<{ content: string }>(`/jobs/${jobId}/report`);
  }

  // Visualization URL
  getVisualizationUrl(jobId: string, name: string): string {
    return `${API_BASE_URL}/jobs/${jobId}/visualization?name=${name}`;
  }

  // Download URL
  getDownloadUrl(jobId: string, type: 'markdown' | 'json' | 'html'): string {
    return `${API_BASE_URL}/jobs/${jobId}/download?type=${type}`;
  }
}

export const apiService = new ApiService();
export type { ApiResponse };