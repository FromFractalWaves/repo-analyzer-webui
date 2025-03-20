// types/index.ts
export interface Repository {
  id: string;
  name: string;
  path: string;
  relative_path: string;
  is_favorite: boolean;
  last_accessed?: string;
  tags?: string;
  last_commit_date?: string;
  last_analysis_job_id?: string;
  metadata?: Record<string, any>;
}

export interface AnalysisJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  repo_path: string;
  report_path?: string;
  error?: string;
  repo_id?: string; // Links to Repository
}

export interface AnalysisRequest {
  repo_path: string;
  recursive?: boolean;
  skip_confirmation?: boolean;
  output_name?: string;
  repo_id?: string; // For linking to Repository
}

export interface RepositoryFilter {
  search?: string;
  is_favorite?: boolean;
  tags?: string[];
  sort_by?: 'name' | 'lastAccessed' | 'lastCommitDate';
  sort_order?: 'asc' | 'desc';
}

// For displaying in the UI
export interface RepositorySearchParams {
  search?: string;
  isFavorite?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'lastAccessed' | 'lastCommitDate';
  sortOrder?: 'asc' | 'desc';
}

export interface CommitData {
  hash: string;
  author: string;
  author_email: string;
  author_date: string;
  committer?: string;
  committer_email?: string;
  commit_date: string;
  message: string;
}

export interface BranchData {
  name: string;
  is_current: boolean;
}

export interface CodeStats {
  total_lines: number;
  file_count: number;
  file_extensions?: Record<string, number>;
}

export interface RepoSummary {
  name: string;
  num_commits: number;
  num_branches: number;
  total_lines: number;
  file_count: number;
  first_commit?: string;
  last_commit?: string;
  time_span_days?: number;
  commits_per_day?: number;
  contributor_count?: number;
  frequent_words?: Record<string, number>;
  file_extensions?: Record<string, number>;
}

export interface AnalysisData {
  repository: {
    name: string;
    path: string;
  };
  commits: CommitData[];
  branches: BranchData[];
  code_stats: CodeStats;
  summary: RepoSummary;
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}