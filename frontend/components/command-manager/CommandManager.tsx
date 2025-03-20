// analyzer_webui/components/command-manager/CommandManager.tsx
import React, { useEffect, useState } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { CommandManagerProps, CommandItem as CommandItemType, CommandGroup as CommandGroupType, CommandPlugin } from './types';

export const CommandManager: React.FC<CommandManagerProps> = ({
  plugins,
  activePluginId,
  onPluginChange,
  className
}) => {
  // State for the command manager
  const [activePlugin, setActivePlugin] = useState<CommandPlugin | null>(null);
  const [items, setItems] = useState<CommandItemType[]>([]);
  const [groups, setGroups] = useState<CommandGroupType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with the first plugin or selected plugin
  useEffect(() => {
    const initPlugin = async () => {
      if (plugins.length === 0) return;
      
      const plugin = activePluginId 
        ? plugins.find(p => p.id === activePluginId) || plugins[0]
        : plugins[0];
      
      try {
        setLoading(true);
        setActivePlugin(plugin);
        
        // Fetch initial items
        const fetchedItems = await plugin.getItems();
        setItems(fetchedItems);
        
        // Get groups if available
        if (plugin.getGroups) {
          setGroups(plugin.getGroups());
        } else {
          setGroups([]);
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load items');
      } finally {
        setLoading(false);
      }
    };
    
    initPlugin();
  }, [plugins, activePluginId]);

  // Handle search
  const handleSearch = async (value: string) => {
    if (!activePlugin) return;
    
    setSearchQuery(value);
    
    try {
      // First get all items
      const allItems = await activePlugin.getItems();
      
      // If plugin has a custom filter function, use it
      if (activePlugin.filterItems) {
        const filtered = activePlugin.filterItems(allItems, value);
        setItems(filtered);
      } else {
        // Default filtering behavior
        if (!value.trim()) {
          setItems(allItems);
          return;
        }
        
        const searchLower = value.toLowerCase();
        const filtered = allItems.filter(item => {
          return (
            item.title.toLowerCase().includes(searchLower) ||
            (item.description && item.description.toLowerCase().includes(searchLower)) ||
            (item.keywords && item.keywords.some(k => k.toLowerCase().includes(searchLower)))
          );
        });
        
        setItems(filtered);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search items');
    }
  };

  // Handle item selection
  const handleSelect = (item: CommandItemType) => {
    if (!activePlugin || !activePlugin.onSelect) return;
    activePlugin.onSelect(item);
  };

  if (!activePlugin) {
    return <div>No plugin selected</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {activePlugin.icon && <activePlugin.icon className="h-5 w-5" />}
          {activePlugin.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={activePlugin.searchPlaceholder || "Type to search..."}
              value={searchQuery}
              onValueChange={handleSearch}
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {loading 
                ? (activePlugin.loadingMessage || 'Loading...') 
                : (activePlugin.emptyStateMessage || 'No results found.')}
            </CommandEmpty>

            {error && (
              <div className="px-4 py-2 text-sm text-red-500">
                {error}
              </div>
            )}

            {groups.length > 0 ? (
              // Render items in groups
              groups.map((group) => (
                <CommandGroup
                  key={group.id}
                  heading={
                    <div className="flex items-center gap-2">
                      {group.icon && <group.icon className="h-4 w-4" />}
                      <span>{group.title}</span>
                    </div>
                  }
                >
                  {group.description && (
                    <div className="pl-4 py-1 text-xs text-muted-foreground">
                      {group.description}
                    </div>
                  )}
                  {items
                    .filter(item => item.group === group.id)
                    .map(item => (
                      <CommandItem
                        key={item.id}
                        onSelect={() => handleSelect(item)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {item.icon && <item.icon className="h-4 w-4" />}
                          <div className="flex flex-col">
                            <span className="font-medium">{item.title}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              ))
            ) : (
              // Render all items without groups
              items.map(item => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </CardContent>
    </Card>
  );
};