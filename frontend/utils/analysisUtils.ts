// utils/analysisUtils.ts
import { CommitData, AnalysisData } from '@/types';
import { 
  AuthorContribution, 
  CommitPatternAnalysis, 
  CommitMessageAnalysis,
  ActivitySummary
} from '@/components/visualizations/types';
import { parseISO, differenceInDays, format, isAfter, isBefore } from 'date-fns';

/**
 * Analyzes author contributions from commit data
 */
export function analyzeAuthorContributions(commitData: Record<string, CommitData[]>): AuthorContribution[] {
  // Track author stats across all repos
  const authorStats: Record<string, AuthorContribution> = {};
  
  // Process all commits across all repos
  Object.values(commitData).forEach(commits => {
    commits.forEach(commit => {
      const author = commit.author;
      const email = commit.author_email;
      const date = commit.author_date;
      
      if (!authorStats[author]) {
        authorStats[author] = {
          name: author,
          email: email,
          commits: 0,
          firstCommit: date,
          lastCommit: date,
          daysActive: 0
        };
      }
      
      // Update stats
      authorStats[author].commits += 1;
      
      // Track first and last commit dates
      if (isBefore(parseISO(date), parseISO(authorStats[author].firstCommit))) {
        authorStats[author].firstCommit = date;
      }
      
      if (isAfter(parseISO(date), parseISO(authorStats[author].lastCommit))) {
        authorStats[author].lastCommit = date;
      }
    });
  });
  
  // Calculate days active for each author
  Object.values(authorStats).forEach(author => {
    author.daysActive = differenceInDays(
      parseISO(author.lastCommit),
      parseISO(author.firstCommit)
    ) + 1; // +1 to include the first day
  });
  
  // Sort by commit count (descending)
  return Object.values(authorStats).sort((a, b) => b.commits - a.commits);
}

/**
 * Analyzes commit patterns by time of day and day of week
 */
export function analyzeCommitPatterns(commitData: Record<string, CommitData[]>): CommitPatternAnalysis {
  // Track commits by day of week and hour
  const byDayOfWeek: Record<string, number> = {
    'Sunday': 0,
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0
  };
  
  const byHour: Record<string, number> = {};
  for (let i = 0; i < 24; i++) {
    byHour[i.toString()] = 0;
  }
  
  // Build heatmap data (day of week × hour of day)
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const heatmapData: Array<{ day: string; hour: number; count: number }> = [];
  
  // Initialize heatmap with zeros
  daysOfWeek.forEach(day => {
    for (let hour = 0; hour < 24; hour++) {
      heatmapData.push({ day, hour, count: 0 });
    }
  });
  
  // Process all commits across all repos
  Object.values(commitData).forEach(commits => {
    commits.forEach(commit => {
      const date = parseISO(commit.commit_date);
      const dayOfWeek = daysOfWeek[date.getDay()];
      const hour = date.getHours();
      
      // Increment counters
      byDayOfWeek[dayOfWeek] += 1;
      byHour[hour.toString()] += 1;
      
      // Find and increment the corresponding heatmap cell
      const heatmapIndex = (date.getDay() * 24) + hour;
      if (heatmapData[heatmapIndex]) {
        heatmapData[heatmapIndex].count += 1;
      }
    });
  });
  
  return { byDayOfWeek, byHour, heatmap: heatmapData };
}

/**
 * Analyzes commit messages for word frequency
 */
export function analyzeCommitMessages(commitData: Record<string, CommitData[]>): CommitMessageAnalysis {
  // Common words to exclude (stop words)
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 
    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'of', 'from', 
    'this', 'that', 'these', 'those', 'it', 'its', 'it\'s', 'they', 'them', 'their',
    'he', 'she', 'his', 'her', 'him', 'has', 'have', 'had'
  ]);
  
  // Track word frequencies
  const wordCounts: Record<string, number> = {};
  let totalCommits = 0;
  
  // Process all commit messages
  Object.values(commitData).forEach(commits => {
    totalCommits += commits.length;
    
    commits.forEach(commit => {
      const message = commit.message.toLowerCase();
      
      // Extract words, remove punctuation
      const words = message
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
      
      // Count occurrences
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });
  });
  
  // Calculate total word count
  const totalWords = Object.values(wordCounts).reduce((sum, count) => sum + count, 0);
  
  // Create frequency data sorted by count (descending)
  const wordFrequencies = Object.entries(wordCounts)
    .map(([word, count]) => ({
      word,
      count,
      frequency: count / totalWords
    }))
    .sort((a, b) => b.count - a.count);
  
  return { wordFrequencies, totalCommits };
}

/**
 * Generates activity summary statistics from analysis data
 */
export function generateActivitySummary(data: AnalysisData): ActivitySummary {
  let firstCommitDate: Date | null = null;
  let lastCommitDate: Date | null = null;
  let totalCommits = 0;
  
  // Find the first and last commit dates across all repos
  Object.values(data.commit_data || {}).forEach(commits => {
    if (commits.length === 0) return;
    
    commits.forEach(commit => {
      const date = parseISO(commit.commit_date);
      
      if (!firstCommitDate || isBefore(date, firstCommitDate)) {
        firstCommitDate = date;
      }
      
      if (!lastCommitDate || isAfter(date, lastCommitDate)) {
        lastCommitDate = date;
      }
    });
    
    totalCommits += commits.length;
  });
  
  if (!firstCommitDate || !lastCommitDate) {
    return {
      averageCommitsPerDay: 0,
      projectDays: 0,
      activityTrend: 'stable'
    };
  }
  
  // Calculate project duration in days
  const projectDays = differenceInDays(lastCommitDate, firstCommitDate) + 1;
  
  // Average commits per day
  const averageCommitsPerDay = totalCommits / projectDays;
  
  // Analyze trends by comparing activity in first half vs second half
  // First, initialize weekly intervals array
  const weekIntervals: Array<{ startDate: Date; endDate: Date; commits: number }> = [];
  
  // Calculate midpoint for trend analysis
  const midpoint = new Date((firstCommitDate.getTime() + lastCommitDate.getTime()) / 2);
  
  let firstHalfCommits = 0;
  let secondHalfCommits = 0;
  
  // Count commits in each half
  Object.values(data.commit_data || {}).forEach(commits => {
    commits.forEach(commit => {
      const date = parseISO(commit.commit_date);
      
      if (isBefore(date, midpoint)) {
        firstHalfCommits++;
      } else {
        secondHalfCommits++;
      }
    });
  });
  
  // Determine trend
  let activityTrend: 'increasing' | 'decreasing' | 'stable';
  
  if (secondHalfCommits > firstHalfCommits * 1.2) {
    activityTrend = 'increasing';
  } else if (firstHalfCommits > secondHalfCommits * 1.2) {
    activityTrend = 'decreasing';
  } else {
    activityTrend = 'stable';
  }
  
  // Return the summary
  return {
    averageCommitsPerDay,
    projectDays,
    activityTrend
  };
}