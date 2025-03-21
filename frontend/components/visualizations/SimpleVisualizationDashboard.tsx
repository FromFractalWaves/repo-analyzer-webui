// components/visualizations/SimpleVisualizationDashboard.tsx
import React, { useState } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisData, AnalysisJob } from '@/types';
import { formatNumber } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GitBranch, GitFork, FileText, Users, BarChart3 } from 'lucide-react';

// Simple metric card component
const MetricCard = ({ title, value, icon: Icon, color }) => (
  <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow border`}>
    <div className="flex items-center">
      <div className={`${color} rounded-md p-3`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-300">
          {title}
        </p>
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  </div>
);

interface SimpleVisualizationDashboardProps {
  job: AnalysisJob;
  data: AnalysisData | null;
  className?: string;
}

const SimpleVisualizationDashboard: React.FC<SimpleVisualizationDashboardProps> = ({
  job,
  data,
  className
}) => {
  const [activeTab, setActiveTab] = useState('summary');

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <p className="text-gray-500">No visualization data available for this job.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary statistics
  const summary = data.summary || {};
  const commits = data.commit_data ? Object.values(data.commit_data).flat() : [];
  const totalCommits = summary.num_commits || commits.length || 0;
  const totalBranches = summary.num_branches || 0;
  const totalLines = summary.total_lines || 0;
  const totalContributors = summary.contributor_count || 0;

  // Prepare data for charts
  const prepareCommitData = () => {
    if (!commits || commits.length === 0) return [];
    
    // Group commits by date
    const commitsByDate = {};
    commits.forEach(commit => {
      const date = new Date(commit.commit_date).toISOString().split('T')[0];
      commitsByDate[date] = (commitsByDate[date] || 0) + 1;
    });
    
    // Convert to array for chart
    return Object.entries(commitsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-20); // Last 20 days
  };
  
  const prepareAuthorsData = () => {
    if (!commits || commits.length === 0) return [];
    
    // Count commits by author
    const authorCounts = {};
    commits.forEach(commit => {
      const author = commit.author;
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    });
    
    // Convert to array and sort by commit count
    return Object.entries(authorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 authors
  };
  
  const prepareFileTypesData = () => {
    const fileTypes = summary.file_extensions || {};
    
    // Convert to array for chart
    return Object.entries(fileTypes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 file types
  };
  
  const commitData = prepareCommitData();
  const authorsData = prepareAuthorsData();
  const fileTypesData = prepareFileTypesData();
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Commits"
          value={formatNumber(totalCommits)}
          icon={GitBranch}
          color="bg-blue-500"
        />
        
        <MetricCard 
          title="Branches"
          value={formatNumber(totalBranches)}
          icon={GitFork}
          color="bg-green-500"
        />
        
        <MetricCard 
          title="Lines of Code"
          value={formatNumber(totalLines)}
          icon={FileText}
          color="bg-purple-500"
        />
        
        <MetricCard 
          title="Contributors"
          value={formatNumber(totalContributors)}
          icon={Users}
          color="bg-amber-500"
        />
      </div>
      
      {/* Visualization Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Repository Visualizations</CardTitle>
          <CardDescription>
            Charts and metrics for {job.repo_path}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="commits">Commit Activity</TabsTrigger>
              <TabsTrigger value="authors">Contributors</TabsTrigger>
              <TabsTrigger value="files">File Types</TabsTrigger>
            </TabsList>
            
            {/* Summary Tab */}
            <TabsContent value="summary" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Commit Timeline Preview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Commit Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {commitData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={commitData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" name="Commits" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-gray-500">
                        No commit data available
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* File Types Preview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">File Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fileTypesData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={fileTypesData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            dataKey="value"
                          >
                            {fileTypesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-gray-500">
                        No file type data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Repository Stats */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Repository Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-sm">Repository</span>
                      <span className="font-medium">{job.repo_path}</span>
                    </div>
                    
                    {summary.first_commit && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-sm">First Commit</span>
                        <span className="font-medium">
                          {new Date(summary.first_commit).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {summary.last_commit && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-sm">Last Commit</span>
                        <span className="font-medium">
                          {new Date(summary.last_commit).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {summary.time_span_days && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-sm">Repository Age</span>
                        <span className="font-medium">{summary.time_span_days} days</span>
                      </div>
                    )}
                    
                    {summary.commits_per_day && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-sm">Avg. Commits Per Day</span>
                        <span className="font-medium">{summary.commits_per_day.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Commits Tab */}
            <TabsContent value="commits" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Commit Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {commitData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={commitData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" name="Commits" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-500">
                      No commit data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Authors Tab */}
            <TabsContent value="authors" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Top Contributors</CardTitle>
                </CardHeader>
                <CardContent>
                  {authorsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        layout="vertical" 
                        data={authorsData}
                        margin={{ left: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 12 }}
                          width={100}
                        />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" name="Commits">
                          {authorsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-500">
                      No contributor data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Files Tab */}
            <TabsContent value="files" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">File Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {fileTypesData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={fileTypesData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              labelLine={true}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              dataKey="value"
                            >
                              {fileTypesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">File Extensions</h3>
                        <div className="space-y-2">
                          {fileTypesData.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span>{entry.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{entry.value}</span>
                                <span className="text-gray-500 text-sm">
                                  files
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-500">
                      No file type data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleVisualizationDashboard;