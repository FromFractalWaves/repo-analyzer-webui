// components/ResultsPanel.tsx
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Loader2, AlertTriangle, GitBranch } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SimpleVisualizationDashboard from './visualizations/SimpleVisualizationDashboard';

const ResultsPanel: React.FC = () => {
  const {
    selectedJob,
    analysisResults,
    analysisReport,
    isLoadingResults,
    resultsError,
    fetchResults,
    setActiveTab
  } = useAppContext();

  if (!selectedJob) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <GitBranch className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Analysis Job Selected</h3>
          <p className="text-gray-500 mb-4">Please select a job from the Jobs tab to view analysis results.</p>
          <Button 
            variant="outline" 
            onClick={() => {
              if (setActiveTab) {
                setActiveTab('jobs');
              }
            }}
          >
            Go to Jobs
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleRefresh = () => {
    if (selectedJob && fetchResults) {
      fetchResults(selectedJob.id);
    }
  };

  // Handle loading, error, or no data states
  if (isLoadingResults) {
    return (
      <Card className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium">Loading Analysis Results</h3>
          <p className="text-gray-500 mt-2">Please wait while we fetch the results...</p>
        </div>
      </Card>
    );
  }

  if (resultsError) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-400">{resultsError}</p>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results: {selectedJob.repo_path.split('/').pop()}</CardTitle>
          <CardDescription>
            Job ID: {selectedJob.id.substring(0, 8)}... • Status: <span className={
              selectedJob.status === 'completed' ? 'text-green-500' : 
              selectedJob.status === 'failed' ? 'text-red-500' :
              selectedJob.status === 'running' ? 'text-blue-500' : 'text-yellow-500'
            }>{selectedJob.status}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="visualizations">
            <TabsList className="mb-4">
              <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
              <TabsTrigger value="report">Report</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visualizations" className="mt-0">
              {analysisResults ? (
                <SimpleVisualizationDashboard
                  job={selectedJob}
                  data={analysisResults}
                />
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No visualization data available for this job.</p>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="report" className="mt-0">
              {analysisReport ? (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {analysisReport}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No report available for this job.</p>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="raw" className="mt-0">
              {analysisResults ? (
                <div className="overflow-auto max-h-[70vh]">
                  <pre className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md text-sm font-mono">
                    {JSON.stringify(analysisResults, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No raw data available for this job.</p>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsPanel;