// context/AppContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Repository, AnalysisJob, AnalysisRequest } from '@/types';
import { apiService, ApiResponse } from '@/services/api';

interface AppContextValue {
  // Active tab
  activeTab: 'discover' | 'jobs' | 'results';
  setActiveTab: (tab: 'discover' | 'jobs' | 'results') => void;
  
  // Repositories
  repositories: Repository[];
  isLoadingRepositories: boolean;
  repositoriesError: string | null;
  selectedRepo: Repository | null;
  setSelectedRepo: (repo: Repository | null) => void;
  discoverRepositories: (baseDir: string, depth?: number) => Promise<Repository[]>;
  clearRepositories: () => void;
  
  // Analysis jobs
  jobs: AnalysisJob[];
  isLoadingJobs: boolean;
  jobsError: string | null;
  selectedJob: AnalysisJob | null;
  setSelectedJob: (job: AnalysisJob | null) => void;
  fetchJobs: () => Promise<AnalysisJob[]>;
  startAnalysis: (request: AnalysisRequest) => Promise<AnalysisJob | null>;
  fetchJob: (jobId: string) => Promise<AnalysisJob | null>;
  
  // Common state
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'discover' | 'jobs' | 'results'>('discover');
  
  // Repository state
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoadingRepositories, setIsLoadingRepositories] = useState<boolean>(false);
  const [repositoriesError, setRepositoriesError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  
  // Jobs state
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [selectedJobState, setSelectedJobState] = useState<AnalysisJob | null>(null);
  
  // Repository management functions
  const discoverRepositories = useCallback(async (baseDir: string, depth: number = 2): Promise<Repository[]> => {
    setIsLoadingRepositories(true);
    setRepositoriesError(null);
    
    try {
      const result = await apiService.discoverRepositories(baseDir, depth);
      
      if (result.error) {
        setRepositoriesError(result.error);
        return [];
      }
      
      if (result.data) {
        setRepositories(result.data);
        return result.data;
      }
      
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setRepositoriesError(errorMessage);
      return [];
    } finally {
      setIsLoadingRepositories(false);
    }
  }, []);
  
  const clearRepositories = useCallback(() => {
    setRepositories([]);
  }, []);
  
  // Job management functions
  const fetchJobs = useCallback(async (): Promise<AnalysisJob[]> => {
    setIsLoadingJobs(true);
    setJobsError(null);
    
    try {
      const result = await apiService.getJobs();
      
      if (result.error) {
        setJobsError(result.error);
        return [];
      }
      
      if (result.data) {
        setJobs(result.data);
        return result.data;
      }
      
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setJobsError(errorMessage);
      return [];
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);
  
  const fetchJob = useCallback(async (jobId: string): Promise<AnalysisJob | null> => {
    setIsLoadingJobs(true);
    setJobsError(null);
    
    try {
      const result = await apiService.getJob(jobId);
      
      if (result.error) {
        setJobsError(result.error);
        return null;
      }
      
      // Update the job in the jobs array if it exists
      if (result.data) {
        setJobs(prevJobs => {
          const jobIndex = prevJobs.findIndex(j => j.id === result.data?.id);
          if (jobIndex >= 0) {
            const newJobs = [...prevJobs];
            newJobs[jobIndex] = result.data!;
            return newJobs;
          }
          return prevJobs;
        });
        
        return result.data;
      }
      
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setJobsError(errorMessage);
      return null;
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);
  
  const startAnalysis = useCallback(async (request: AnalysisRequest): Promise<AnalysisJob | null> => {
    setIsLoadingJobs(true);
    setJobsError(null);
    
    try {
      const result = await apiService.startAnalysis(request);
      
      if (result.error) {
        setJobsError(result.error);
        return null;
      }
      
      // Add the new job to the jobs list if it exists
      if (result.data) {
        setJobs(prevJobs => [result.data!, ...prevJobs]);
        return result.data;
      }
      
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setJobsError(errorMessage);
      return null;
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);
  
  // Common error handling
  const setError = useCallback((error: string | null) => {
    setRepositoriesError(error);
    setJobsError(error);
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);
  
  // Select job and switch to results tab
  const setSelectedJob = useCallback((job: AnalysisJob | null) => {
    setSelectedJobState(job);
    if (job) {
      setActiveTab('results');
    }
  }, []);
  
  const value: AppContextValue = {
    activeTab,
    setActiveTab,
    
    repositories,
    isLoadingRepositories,
    repositoriesError,
    selectedRepo,
    setSelectedRepo,
    discoverRepositories,
    clearRepositories,
    
    jobs,
    isLoadingJobs,
    jobsError,
    selectedJob: selectedJobState,
    setSelectedJob,
    fetchJobs,
    startAnalysis,
    fetchJob,
    
    setError,
    clearError
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}