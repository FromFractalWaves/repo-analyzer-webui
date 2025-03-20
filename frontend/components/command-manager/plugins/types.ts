// @/components/command-manager/plugins/types.ts
import { Content, ContentItem } from '@/types/api';
import { CommandItem, CommandPlugin } from '../types';
import ContentAPI from '@/services/api';

// Base content data type that can be either Content or ContentItem
export type ContentData = Content | ContentItem;

// Metadata for content items in the command interface
export interface ContentCommandMetadata {
  type: 'content' | 'item';
  contentType: string;
  parentContent?: Content;
  previewText?: string;
}

// Extension of CommandItem specifically for content data
export interface ContentCommandItem extends CommandItem<ContentData> {
  metadata: ContentCommandMetadata;
}

// Base plugin configuration options
export interface BaseContentPluginOptions {
  api: ContentAPI;
  onSelect?: (item: ContentData) => void;
  filter?: (item: ContentData) => boolean;
  searchPlaceholder?: string;
}

// Base content plugin type
export interface BaseContentPlugin extends CommandPlugin<ContentData> {
  api: ContentAPI;
  getItems: () => Promise<ContentCommandItem[]>;
}

// Helper type guard to check if an item is a Content
export function isContent(item: ContentData): item is Content {
  return 'type' in item && !('content_id' in item);
}

// Helper type guard to check if an item is a ContentItem
export function isContentItem(item: ContentData): item is ContentItem {
  return 'content_id' in item;
}