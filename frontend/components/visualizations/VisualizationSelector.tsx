// components/visualizations/VisualizationSelector.tsx
import React from 'react';
import { BarChart3, LayoutGrid, ListFilter, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Default visualizations if none are provided
const DEFAULT_VISUALIZATIONS = [
  {
    id: 'commit-timeline',
    name: 'Commit Timeline',
    description: 'Timeline of commits over time'
  },
  {
    id: 'commit-heatmap',
    name: 'Commit Activity Heatmap',
    description: 'Heatmap showing commit density by day and hour'
  },
  {
    id: 'author-stats',
    name: 'Author Statistics',
    description: 'Contribution statistics by author'
  },
  {
    id: 'file-extension-chart',
    name: 'File Types Distribution',
    description: 'Distribution of files by extension'
  },
  {
    id: 'commit-word-cloud',
    name: 'Commit Message Word Cloud',
    description: 'Word cloud of frequent terms in commit messages'
  }
];

interface VisualizationConfig {
  id: string;
  name: string;
  description?: string;
}

interface VisualizationSelectorProps {
  selectedVisualizations: string[];
  onSelectionChange: (visualizations: string[]) => void;
  availableVisualizations?: VisualizationConfig[];
  className?: string;
}

const VisualizationSelector: React.FC<VisualizationSelectorProps> = ({
  selectedVisualizations,
  onSelectionChange,
  availableVisualizations = DEFAULT_VISUALIZATIONS,
  className
}) => {
  // Toggle a single visualization
  const toggleVisualization = (visId: string) => {
    onSelectionChange(
      selectedVisualizations.includes(visId)
        ? selectedVisualizations.filter(id => id !== visId)
        : [...selectedVisualizations, visId]
    );
  };

  // Select all visualizations
  const selectAll = () => {
    onSelectionChange(availableVisualizations.map(vis => vis.id));
  };

  // Clear all selections
  const clearAll = () => {
    onSelectionChange([]);
  };

  // Select recommended/default visualizations
  const selectRecommended = () => {
    onSelectionChange([
      'commit-timeline', 
      'author-stats', 
      'commit-heatmap', 
      'file-extension-chart'
    ]);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center">
            <ListFilter className="h-4 w-4 mr-2" />
            Visualizations
            <span className="ml-1 text-xs bg-blue-100 text-blue-800 rounded-full px-1.5 py-0.5 dark:bg-blue-900 dark:text-blue-200">
              {selectedVisualizations.length}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Select Visualizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {availableVisualizations.map(vis => (
            <DropdownMenuCheckboxItem
              key={vis.id}
              checked={selectedVisualizations.includes(vis.id)}
              onCheckedChange={() => toggleVisualization(vis.id)}
            >
              {vis.name}
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator />
          <div className="p-2 flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-xs h-8"
              onClick={selectAll}
            >
              All
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-xs h-8"
              onClick={clearAll}
            >
              None
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-xs h-8"
              onClick={selectRecommended}
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Layout
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuCheckboxItem checked>
            Grid (2 columns)
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>
            Full Width (1 column)
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>
            Compact (3 columns)
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" className="flex items-center">
        <BarChart3 className="h-4 w-4 mr-2" />
        Chart Style
      </Button>
    </div>
  );
};

export default VisualizationSelector;