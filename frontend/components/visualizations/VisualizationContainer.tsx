// components/visualizations/VisualizationContainer.tsx
import React, { useState } from 'react';
import { 
  BarChart3, 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Minimize2,
  Download,
  RotateCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VisualizationProps } from './types';

interface VisualizationContainerProps {
  title: string;
  description?: string;
  visualization: React.ComponentType<VisualizationProps>;
  visualizationProps: VisualizationProps;
  className?: string;
}

const VisualizationContainer: React.FC<VisualizationContainerProps> = ({
  title,
  description,
  visualization: VisualizationComponent,
  visualizationProps,
  className
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  return (
    <Card className={`overflow-hidden ${className} ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader className="py-3 px-4 flex flex-row justify-between items-center space-y-0">
        <div>
          <CardTitle className="text-md flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
            {title}
          </CardTitle>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className={`p-0 ${isFullscreen ? 'overflow-auto h-[calc(100%-60px)]' : ''}`}>
          <VisualizationComponent
            {...visualizationProps}
            height={isFullscreen ? 'calc(100vh - 150px)' : 400}
          />
        </CardContent>
      )}
    </Card>
  );
};

export default VisualizationContainer;