// components/TabNavigation.tsx
'use client';

import React from 'react';
import { useStore } from '@/store';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: 'discover' | 'jobs' | 'results') => void;
  hasCompletedJob: boolean;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  hasCompletedJob
}) => {
  return (
    <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 mb-6">
      <button
        className={`px-4 py-2 font-medium ${
          activeTab === 'discover'
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
            : 'text-gray-600 dark:text-gray-300'
        }`}
        onClick={() => setActiveTab('discover')}
      >
        Discover
      </button>
      <button
        className={`px-4 py-2 font-medium ${
          activeTab === 'jobs'
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
            : 'text-gray-600 dark:text-gray-300'
        }`}
        onClick={() => setActiveTab('jobs')}
      >
        Jobs
      </button>
      <button
        className={`px-4 py-2 font-medium ${
          activeTab === 'results'
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
            : 'text-gray-600 dark:text-gray-300 opacity-50'
        } ${hasCompletedJob ? '' : 'cursor-not-allowed'}`}
        onClick={() => {
          if (hasCompletedJob) {
            setActiveTab('results');
          }
        }}
      >
        Results
      </button>
    </div>
  );
};

export default TabNavigation;