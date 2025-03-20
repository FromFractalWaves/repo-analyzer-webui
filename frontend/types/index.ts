// analyzer_webui/types/index.ts - Updated with repository types
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
  repo_id?: string; // Added repo_id to link to Repository
}

export interface AnalysisRequest {
  repo_path: string;
  recursive?: boolean;
  skip_confirmation?: boolean;
  output_name?: string;
  repo_id?: string; // Added repo_id to link to Repository
}

export interface CommitData {
  hash: string;
  author: string;
  author_email: string;
  author_date: string;
  committer: string;
  committer_email: string;
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
  num_commits: number;
  num_branches: number;
  total_lines: number;
  file_count: number;
  first_commit?: string;
  last_commit?: string;
  time_span?: number;
  commits_per_day?: number;
  avg_time_between_commits?: number;
  min_time_between_commits?: number;
  max_time_between_commits?: number;
  peak_pace_commits?: number;
  peak_pace_duration?: number;
  peak_pace_start?: string;
  peak_pace_end?: string;
  lines_per_commit?: number;
  frequent_words?: Record<string, number>;
  file_extensions?: Record<string, number>;
}

export interface AggregateStats {
  total_commits: number;
  total_branches: number;
  total_lines: number;
  repos_analyzed: number;
  first_commit?: string;
  last_commit?: string;
  time_span?: number;
  overall_commits_per_day?: number;
  frequent_words?: Record<string, number>;
  fastest_pace?: number;
  fastest_pace_repo?: string;
}

export interface AnalysisData {
  commit_data: Record<string, CommitData[]>;
  branch_data: Record<string, BranchData[]>;
  code_stats: Record<string, CodeStats>;
  summary_stats: Record<string, RepoSummary>;
  aggregate_stats: AggregateStats;
  data_file?: string;
}

// Define the ApiResponse interface for handling responses
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// HTTP validation error from FastAPI
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// Enhanced search params for repositories
export interface RepositorySearchParams {
  isFavorite?: boolean;
  tags?: string[];
  search?: string;
  sortBy?: 'name' | 'lastAccessed' | 'lastCommitDate';
  sortOrder?: 'asc' | 'desc';
}

// Repository creation and update requests
export interface CreateRepositoryRequest {
  name: string;
  path: string;
  relative_path: string;
  tags?: string; // Comma-separated tags
  metadata?: Record<string, any>;
}

export interface UpdateRepositoryRequest extends Partial<Repository> {
  id: string; // ID is required for updates
}