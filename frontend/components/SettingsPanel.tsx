// components/SettingsPanel.tsx
'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Sun, 
  Moon, 
  Database, 
  FolderGit,
  HardDrive,
  Save
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SettingsPanel: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [reportsDir, setReportsDir] = useState<string>('./reports');
  const [apiPort, setApiPort] = useState<string>('8000');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Handle saving settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // This would be where you'd make an API call to save settings
    // For now, we'll just simulate a delay
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-blue-500" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Customize application behavior and appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Appearance Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Appearance</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={theme}
                  onValueChange={(value) => setTheme(value as 'light' | 'dark')}
                >
                  <SelectTrigger id="theme" className="w-full max-w-xs">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" className="flex items-center">
                      <div className="flex items-center">
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Storage Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Storage</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reportsDir">Reports Directory</Label>
                <div className="flex gap-2">
                  <Input
                    id="reportsDir"
                    value={reportsDir}
                    onChange={(e) => setReportsDir(e.target.value)}
                    className="max-w-md"
                  />
                  <Button variant="outline" size="sm">
                    <FolderGit className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Location where analysis reports and data will be stored
                </p>
              </div>
              
              <div>
                <Label htmlFor="databasePath">Database Path</Label>
                <div className="flex gap-2">
                  <Input
                    id="databasePath"
                    value="./data/database.db"
                    disabled
                    className="max-w-md bg-muted"
                  />
                  <Button variant="outline" size="sm" disabled>
                    <Database className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  SQLite database location (restart required to change)
                </p>
              </div>
            </div>
          </div>
          
          {/* API Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">API Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiHost">API Host</Label>
                <Input
                  id="apiHost"
                  value="0.0.0.0"
                  disabled
                  className="max-w-xs bg-muted"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Host address for the API server
                </p>
              </div>
              
              <div>
                <Label htmlFor="apiPort">API Port</Label>
                <Input
                  id="apiPort"
                  value={apiPort}
                  onChange={(e) => setApiPort(e.target.value)}
                  className="max-w-xs"
                  type="number"
                  min="1024"
                  max="65535"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Port for the API server (restart required)
                </p>
              </div>
            </div>
          </div>
          
          {/* System Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-md">
                <div className="flex items-start mb-2">
                  <HardDrive className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Disk Usage</h4>
                    <p className="text-sm text-muted-foreground">127 MB used by reports and database</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              
              <div className="p-4 border rounded-md">
                <div className="flex items-start">
                  <Database className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Database</h4>
                    <p className="text-sm text-muted-foreground">32 repositories saved</p>
                    <p className="text-sm text-muted-foreground">54 analysis jobs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;