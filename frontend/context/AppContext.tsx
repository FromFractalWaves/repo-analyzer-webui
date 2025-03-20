// context/AppContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Repository, AnalysisJob, AnalysisRequest, AnalysisData } from '@/types';
import { apiService, ApiResponse } from '@/services/api';
import { useRepositoryStore } from '@/store/useRepositoryStore';

interface AppContextValue {
  // Active tab
  activeTab: 'discover' | 'repositories' | 'jobs' | 'results';
  setActiveTab: (tab: 'discover' | 'repositories' | 'jobs' | 'results') => void;
  
  // Repository discovery
  discoveredRepositories: Repository[];
  isDiscovering: boolean;
  discoverError: string | null;
  discoverRepositories: (baseDir: string, depth?: number) => Promise<Repository[]>;
  clearDiscoveredRepositories: () => void;
  saveDiscoveredRepository: (repo: Repository) => Promise<Repository | null>;
  
  // Jobs
  jobs: AnalysisJob[];
  isLoadingJobs: boolean;
  jobsError: string | null;
  selectedJob: AnalysisJob | null;
  setSelectedJob: (job: AnalysisJob | null) => void;
  fetchJobs: () => Promise<AnalysisJob[]>;
  startAnalysis: (request: AnalysisRequest) => Promise<AnalysisJob | null>;
  fetchJob: (jobId: string) => Promise<AnalysisJob | null>;
  
  // Analysis results
  analysisResults: AnalysisData | null;
  analysisReport: string | null;
  isLoadingResults: boolean;
  resultsError: string | null;
  fetchResults: (jobId: string) => Promise<void>;
  
  // Common state
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'discover' | 'repositories' | 'jobs' | 'results'>('discover');
  
  // Repository discovery state
  const [discoveredRepositories, setDiscoveredRepositories] = useState<Repository[]>([]);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  
  // Jobs state
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [selectedJob, setSelectedJobState] = useState<AnalysisJob | null>(null);
  
  // Analysis results state
  const [analysisResults, setAnalysisResults] = useState<AnalysisData | null>(null);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  
  // Get repository store functions
  const { createRepository } = useRepositoryStore();
  
  // Load jobs on first render
  useEffect(() => {
    fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Repository discovery functions
  const discoverRepositories = useCallback(async (baseDir: string, depth: number = 2): Promise<Repository[]> => {
    setIsDiscovering(true);
    setDiscoverError(null);
    
    try {
      const result = await apiService.discoverRepositories(baseDir, depth);
      
      if (result.error) {
        setDiscoverError(result.error);
        return [];
      }
      
      if (result.data) {
        setDiscoveredRepositories(result.data);
        return result.data;
      }
      
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDiscoverError(errorMessage);
      return [];
    } finally {
      setIsDiscovering(false);
    }
  }, []);
  
  const clearDiscoveredRepositories = useCallback(() => {
    setDiscoveredRepositories([]);
  }, []);
  
  const saveDiscoveredRepository = useCallback(async (repo: Repository): Promise<Repository | null> => {
    try {
      // Save the repository to the database using the repository store
      return await createRepository(repo);
    } catch (error) {
      setDiscoverError(error instanceof Error ? error.message : 'Failed to save repository');
      return null;
    }
  }, [createRepository]);
  
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
        setJobs((prevJobs: AnalysisJob[]) => {
          const jobIndex = prevJobs.findIndex((j: AnalysisJob) => j.id === result.data?.id);
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
        setJobs((prevJobs: AnalysisJob[]) => [result.data!, ...prevJobs]);
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
  
  // Analysis results functions
  const fetchResults = useCallback(async (jobId: string): Promise<void> => {
    setIsLoadingResults(true);
    setResultsError(null);
    
    try {
      // Fetch both data and report in parallel
      const [dataResult, reportResult] = await Promise.all([
        apiService.getAnalysisData(jobId),
        apiService.getAnalysisReport(jobId).catch(() => ({ error: "Couldn't fetch report" } as ApiResponse<{ content: string }>))
      ]);
      
      if (dataResult.error) {
        setResultsError(dataResult.error);
        return;
      }
      
      // Set the analysis results
      setAnalysisResults(dataResult.data || null);
      setAnalysisReport(reportResult.error ? null : (reportResult.data ? reportResult.data.content : null));
    } catch (error) {
      setResultsError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoadingResults(false);
    }
  }, []);
  
  // Common error handling
  const setError = useCallback((error: string | null) => {
    setDiscoverError(error);
    setJobsError(error);
    setResultsError(error);
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);
  
  // Select job and switch to results tab
  const setSelectedJob = useCallback((job: AnalysisJob | null) => {
    setSelectedJobState(job);
    if (job) {
      setActiveTab('results');
      // Automatically fetch results for the selected job
      fetchResults(job.id);
    }
  }, [fetchResults]);
  
  const value: AppContextValue = {
    activeTab,
    setActiveTab,
    
    discoveredRepositories,
    isDiscovering,
    discoverError,
    discoverRepositories,
    clearDiscoveredRepositories,
    saveDiscoveredRepository,
    
    jobs,
    isLoadingJobs,
    jobsError,
    selectedJob,
    setSelectedJob,
    fetchJobs,
    startAnalysis,
    fetchJob,
    
    analysisResults,
    analysisReport,
    isLoadingResults,
    resultsError,
    fetchResults,
    
    setError,
    clearError
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}