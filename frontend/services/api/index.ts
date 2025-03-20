// analyzer_webui/services/api/index.ts - Updated with repository management methods
import { Repository, AnalysisJob, AnalysisData, AnalysisRequest, ApiResponse } from "@/types";

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

  // Directory browsing (existing endpoint)
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

  // Repository discovery (existing endpoint)
  async discoverRepositories(baseDir: string, depth: number = 2): Promise<ApiResponse<Repository[]>> {
    return this.request<Repository[]>(`/discover_repos?base_dir=${encodeURIComponent(baseDir)}&depth=${depth}`);
  }

  // Repository CRUD operations - new methods
  
  /**
   * Get all saved repositories
   */
  async getRepositories(): Promise<ApiResponse<Repository[]>> {
    return this.request<Repository[]>('/repositories');
  }

  /**
   * Get a specific repository by ID
   */
  async getRepository(repoId: string): Promise<ApiResponse<Repository>> {
    return this.request<Repository>(`/repositories/${repoId}`);
  }

  /**
   * Create a new repository
   */
  async createRepository(repository: Repository): Promise<ApiResponse<Repository>> {
    try {
      const response = await fetch(`${API_BASE_URL}/repositories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(repository),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
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

  /**
   * Update an existing repository
   */
  async updateRepository(repoId: string, repository: Repository): Promise<ApiResponse<Repository>> {
    return this.request<Repository>(`/repositories/${repoId}`, {
      method: 'PUT',
      body: JSON.stringify(repository),
    });
  }

  /**
   * Delete a repository
   */
  async deleteRepository(repoId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/repositories/${repoId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all unique repository tags
   */
  async getRepositoryTags(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/repositories/tags');
  }

  /**
   * Toggle favorite status for a repository
   */
  async toggleRepositoryFavorite(repoId: string, isFavorite: boolean): Promise<ApiResponse<Repository>> {
    return this.request<Repository>(`/repositories/${repoId}/favorite?is_favorite=${isFavorite}`, {
      method: 'POST',
    });
  }

  // Job management - existing endpoints
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

  // Analysis results - existing endpoints
  async getAnalysisData(jobId: string): Promise<ApiResponse<AnalysisData>> {
    return this.request<AnalysisData>(`/jobs/${jobId}/data`);
  }

  async getAnalysisReport(jobId: string): Promise<ApiResponse<{ content: string }>> {
    return this.request<{ content: string }>(`/jobs/${jobId}/report`);
  }

  // Visualization URL (existing method)
  getVisualizationUrl(jobId: string, name: string): string {
    return `${API_BASE_URL}/jobs/${jobId}/visualization?name=${name}`;
  }

  // Download URL (existing method)
  getDownloadUrl(jobId: string, type: 'markdown' | 'json' | 'html'): string {
    return `${API_BASE_URL}/jobs/${jobId}/download?type=${type}`;
  }
}

export const apiService = new ApiService();
export type { ApiResponse };