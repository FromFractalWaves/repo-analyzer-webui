// store/index.ts - Updated to match OpenAPI specification
import { create } from 'zustand';
import { Repository, AnalysisJob, AnalysisRequest, AnalysisData } from '@/types';
import { apiService } from '@/services/api';

interface AppState {
  // Active tab
  activeTab: 'discover' | 'jobs' | 'results';
  setActiveTab: (tab: 'discover' | 'jobs' | 'results') => void;

  // Repositories
  repositories: Repository[];
  isLoadingRepositories: boolean;
  repositoriesError: string | null;
  selectedRepo: Repository | null;
  setSelectedRepo: (repo: Repository | null) => void;
  discoverRepositories: (baseDir: string, depth?: number) => Promise<void>;
  clearRepositories: () => void;

  // Analysis Jobs
  jobs: AnalysisJob[];
  isLoadingJobs: boolean;
  jobsError: string | null;
  selectedJob: AnalysisJob | null;
  setSelectedJob: (job: AnalysisJob | null) => void;
  fetchJobs: () => Promise<void>;
  startAnalysis: (request: AnalysisRequest) => Promise<void>;
  fetchJob: (jobId: string) => Promise<void>;

  // Analysis Results
  analysisResults: AnalysisData | null;
  analysisReport: string | null;
  isLoadingResults: boolean;
  resultsError: string | null;
  fetchResults: (jobId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  activeTab: 'discover',
  setActiveTab: (tab) => set({ activeTab: tab }),

  repositories: [],
  isLoadingRepositories: false,
  repositoriesError: null,
  selectedRepo: null,
  setSelectedRepo: (repo) => set({ selectedRepo: repo }),
  discoverRepositories: async (baseDir, depth = 2) => {
    set({ isLoadingRepositories: true, repositoriesError: null });
    try {
      const result = await apiService.discoverRepositories(baseDir, depth);
      if (result.error) {
        set({ repositoriesError: result.error, isLoadingRepositories: false });
        return;
      }
      set({ repositories: result.data || [], isLoadingRepositories: false });
    } catch (error) {
      set({ 
        repositoriesError: error instanceof Error ? error.message : 'An unknown error occurred', 
        isLoadingRepositories: false 
      });
    }
  },
  clearRepositories: () => set({ repositories: [] }),

  jobs: [],
  isLoadingJobs: false,
  jobsError: null,
  selectedJob: null,
  setSelectedJob: (job) => {
    set({ selectedJob: job });
    if (job) get().setActiveTab('results');
  },
  fetchJobs: async () => {
    set({ isLoadingJobs: true, jobsError: null });
    try {
      const result = await apiService.getJobs();
      if (result.error) {
        set({ jobsError: result.error, isLoadingJobs: false });
        return;
      }
      set({ jobs: result.data || [], isLoadingJobs: false });
    } catch (error) {
      set({ 
        jobsError: error instanceof Error ? error.message : 'An unknown error occurred', 
        isLoadingJobs: false 
      });
    }
  },
  startAnalysis: async (request) => {
    set({ isLoadingJobs: true, jobsError: null });
    try {
      const result = await apiService.startAnalysis(request);
      if (result.error) {
        set({ jobsError: result.error, isLoadingJobs: false });
        return;
      }
      
      if (result.data) {
        set((state) => ({
          jobs: [result.data!, ...state.jobs],
          isLoadingJobs: false,
          activeTab: 'jobs',
        }));
      } else {
        set({ jobsError: 'No job data returned', isLoadingJobs: false });
      }
    } catch (error) {
      set({ 
        jobsError: error instanceof Error ? error.message : 'An unknown error occurred', 
        isLoadingJobs: false 
      });
    }
  },
  fetchJob: async (jobId) => {
    set({ isLoadingJobs: true, jobsError: null });
    try {
      const result = await apiService.getJob(jobId);
      if (result.error) {
        set({ jobsError: result.error, isLoadingJobs: false });
        return;
      }
      
      if (result.data) {
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === result.data!.id ? result.data! : j)),
          selectedJob: state.selectedJob?.id === result.data!.id ? result.data! : state.selectedJob,
          isLoadingJobs: false,
        }));
      }
    } catch (error) {
      set({ 
        jobsError: error instanceof Error ? error.message : 'An unknown error occurred', 
        isLoadingJobs: false 
      });
    }
  },

  analysisResults: null,
  analysisReport: null,
  isLoadingResults: false,
  resultsError: null,
  fetchResults: async (jobId) => {
    set({ isLoadingResults: true, resultsError: null });
    try {
      // Fetch both data and report in parallel
      const [dataResult, reportResult] = await Promise.all([
        apiService.getAnalysisData(jobId),
        apiService.getAnalysisReport(jobId).catch(() => ({ error: "Couldn't fetch report" }))
      ]);
      
      if (dataResult.error) {
        set({ resultsError: dataResult.error, isLoadingResults: false });
        return;
      }
      
      // Set the analysis results
      set({ 
        analysisResults: dataResult.data || null,
        analysisReport: reportResult.error ? null : (reportResult.data ? reportResult.data.content : null),
        isLoadingResults: false 
      });
    } catch (error) {
      set({ 
        resultsError: error instanceof Error ? error.message : 'An unknown error occurred', 
        isLoadingResults: false 
      });
    }
  },
}));