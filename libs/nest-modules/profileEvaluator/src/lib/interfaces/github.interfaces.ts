import { Domain } from '../constants/domain.constants';

/**
 * GitHub repository information
 */
export interface Repository {
  name: string;
  description: string;
  fork: boolean;
  languages: Record<string, number>;
  commits: number;
}

/**
 * GitHub contribution information
 */
export interface Contribution {
  totalContributions: number;
  contributions: ContributionDay[];
}

/**
 * GitHub contribution day
 */
export interface ContributionDay {
  date: string;
  contributionCount: number;
}

/**
 * GitHub score result
 */
export interface GitHubScore {
  total: number;
  totalScore: number;
  domainScore: number;
  contributionScore: number;
  domains: Record<string, string>;
  technologies: string[];
  error?: string; // Optional error message if evaluation failed
}

/**
 * GitHub user response
 */
export interface GitHubUserResponse {
  technologies: string[];
  user_repo_info: UserRepoInfo[];
  repo_count: number;
}

/**
 * GitHub user repository information
 */
export interface UserRepoInfo {
  repoName: string;
  commit: number;
  languages: Record<string, string>;
}

/**
 * Domain count record
 */
export interface DomainCount {
  [domain: string]: string;
}
