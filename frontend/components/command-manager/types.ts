// analyzer_webui/components/command-manager/types.ts
import { LucideIcon } from 'lucide-react';

export interface CommandItem<T = any> {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  data: T;
  group?: string;
  keywords?: string[];
  metadata?: Record<string, any>;
}

export interface CommandGroup {
  id: string;
  title: string;
  icon?: LucideIcon;
  description?: string;
}

export interface CommandPlugin<T = any> {
  id: string;
  name: string;
  description?: string;
  icon?: LucideIcon;
  
  // Core plugin methods
  getItems: () => Promise<CommandItem<T>[]> | CommandItem<T>[];
  getGroups?: () => CommandGroup[];
  
  // Search and filtering
  filterItems?: (items: CommandItem<T>[], search: string) => CommandItem<T>[];
  
  // Handling
  onSelect?: (item: CommandItem<T>) => void;
  
  // Optional configuration
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  loadingMessage?: string;
}

export interface CommandManagerProps {
  plugins: CommandPlugin[];
  activePluginId?: string;
  onPluginChange?: (pluginId: string) => void;
  className?: string;
}