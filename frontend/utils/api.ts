import { ApiResponse } from '@/types';

/**
 * Generic function to make API requests with error handling
 */
export async function apiRequest<T, D = any>(
  url: string,
  options?: RequestInit,
  data?: D
): Promise<ApiResponse<T>> {
  try {
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    };

    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error || `Error: ${response.status} ${response.statusText}` };
    }
    
    const responseData = await response.json();
    return { data: responseData };
  } catch (error) {
    console.error('API Request Error:', error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

/**
 * Helper function for GET requests
 */
export async function apiGet<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...options, method: 'GET' });
}

/**
 * Helper function for POST requests
 */
export async function apiPost<T, D = any>(url: string, data: D, options?: RequestInit): Promise<ApiResponse<T>> {
  return apiRequest<T, D>(url, { ...options, method: 'POST' }, data);
}

/**
 * Helper function to handle file download
 */
export function downloadFile(url: string, filename?: string): void {
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  
  // Set the download attribute with the filename if provided
  if (filename) {
    link.download = filename;
  }
  
  // Append to the body
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Remove the element
  document.body.removeChild(link);
}