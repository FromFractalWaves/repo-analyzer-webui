/**
 * Format a date string to a user-friendly format
 */
export function formatDate(dateString: string | undefined | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
  
  /**
   * Format a timestamp in seconds to a readable duration
   */
  export function formatDuration(seconds: number | undefined | null): string {
    if (!seconds) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  /**
   * Truncate a long path for display
   */
  export function formatPath(path: string, maxLength: number = 40): string {
    if (path.length <= maxLength) return path;
    return `...${path.substring(path.length - maxLength)}`;
  }
  
  /**
   * Format a number with commas
   */
  export function formatNumber(num: number | undefined | null): string {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  }
  
  /**
   * Get the repository name from a path
   */
  export function getRepoNameFromPath(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }
  
  /**
   * Format minutes to hours and minutes
   */
  export function formatMinutes(minutes: number | undefined | null): string {
    if (!minutes) return 'N/A';
    
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
  }
  
  /**
   * Truncate a string to a maximum length
   */
  export function truncateString(str: string, maxLength: number = 100): string {
    if (str.length <= maxLength) return str;
    return `${str.substring(0, maxLength)}...`;
  }
  
  /**
   * Generate a color based on a string (useful for consistent colorization)
   */
  export function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    
    return color;
  }
  
  /**
   * Generate abbreviated ID for displaying in UI
   */
  export function abbreviateId(id: string, length: number = 8): string {
    if (!id) return 'N/A';
    if (id.length <= length) return id;
    return `${id.substring(0, length)}...`;
  }