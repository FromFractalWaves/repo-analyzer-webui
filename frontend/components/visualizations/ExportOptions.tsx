// components/visualizations/ExportOptions.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Code, FileJson } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { apiService } from '@/services/api';

interface ExportOptionsProps {
  jobId: string;
  className?: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ jobId, className }) => {
  // Handle report download
  const handleDownload = (format: 'markdown' | 'html' | 'json') => {
    const url = apiService.getDownloadUrl(jobId, format);
    window.open(url, '_blank');
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Export Analysis</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleDownload('markdown')} className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            <span>Markdown Report</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleDownload('html')} className="cursor-pointer">
            <Code className="h-4 w-4 mr-2" />
            <span>HTML Report</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleDownload('json')} className="cursor-pointer">
            <FileJson className="h-4 w-4 mr-2" />
            <span>Raw JSON Data</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ExportOptions;