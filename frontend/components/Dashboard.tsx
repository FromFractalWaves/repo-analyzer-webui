// components/Dashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  FolderGit, 
  FileSearch, 
  ChartBar, 
  Settings, 
  MenuIcon, 
  Moon, 
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { useAppContext } from '@/context/AppContext';

// Import components for each tab
import EnhancedRepositoryDiscovery from './repository/EnhancedRepositoryDiscovery';
import JobList from './JobList';
import ResultsPanel from './ResultsPanel';
import SettingsPanel from './SettingsPanel'; // You'll need to create this

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { activeTab, setActiveTab } = useAppContext();

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'discover' | 'jobs' | 'results');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside 
        className={`bg-card border-r border-border transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          {sidebarOpen ? (
            <h1 className="font-bold text-lg">Repo Analyzer</h1>
          ) : (
            <span></span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <Tabs 
            orientation="vertical" 
            value={activeTab} 
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="flex flex-col items-stretch bg-transparent gap-1 p-2">
              <TabsTrigger 
                value="discover" 
                className={`flex items-center p-2 justify-${sidebarOpen ? 'start' : 'center'} gap-2`}
              >
                <FolderGit className="h-5 w-5" />
                {sidebarOpen && <span>Repositories</span>}
              </TabsTrigger>
              <TabsTrigger 
                value="jobs"
                className={`flex items-center p-2 justify-${sidebarOpen ? 'start' : 'center'} gap-2`}
              >
                <FileSearch className="h-5 w-5" />
                {sidebarOpen && <span>Jobs</span>}
              </TabsTrigger>
              <TabsTrigger 
                value="results"
                className={`flex items-center p-2 justify-${sidebarOpen ? 'start' : 'center'} gap-2`}
              >
                <ChartBar className="h-5 w-5" />
                {sidebarOpen && <span>Results</span>}
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className={`flex items-center p-2 justify-${sidebarOpen ? 'start' : 'center'} gap-2`}
              >
                <Settings className="h-5 w-5" />
                {sidebarOpen && <span>Settings</span>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'discover' && <EnhancedRepositoryDiscovery />}
        {activeTab === 'jobs' && <JobList />}
        {activeTab === 'results' && <ResultsPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
};

export default Dashboard;