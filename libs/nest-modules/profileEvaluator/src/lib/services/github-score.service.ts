import { Injectable } from '@nestjs/common';
import { CustomLogger } from '../utils/custom.logger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DomainService } from './domain.service';
import { Domain } from '../constants/domain.constants';
import { IGNORE_GITHUB_REPOS, NON_CODE_FILE_EXTENSIONS } from '../constants/github.constants';
import * as path from 'path';
import {
  Contribution,
  ContributionDay,
  DomainCount,
  GitHubScore,
  GitHubUserResponse,
  Repository,
} from '../interfaces/github.interfaces';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubScoreService {
  private readonly logger = new CustomLogger(GitHubScoreService.name);
  private readonly GITHUB_API_URL = 'https://api.github.com';
  private tokens: string[] = [];
  private currentTokenIndex: number = 0;
  private tokenRateLimits: Map<string, {
    remaining: number;
    reset: Date;
    graphqlRemaining: number;
  }> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly domainService: DomainService,
    private readonly configService: ConfigService,
  ) {
    // Parse comma-separated tokens
    const tokens = this.configService.get<string>('GITHUB_ACCESS_TOKENS')?.split(',') || [];
    this.tokens = tokens.map(t => t.trim()).filter(t => t); // Remove whitespace and empty tokens
    
    if (this.tokens.length === 0) {
      this.logger.warn('No GitHub tokens configured - rate limits will be restricted');
    } else {
      this.logger.log(`Initialized with ${this.tokens.length} GitHub tokens`);
      // Initialize rate limits for all tokens
      this.tokens.forEach(token => {
        this.tokenRateLimits.set(token, {
          remaining: 5000, // Default GitHub API limit
          reset: new Date(),
          graphqlRemaining: 5000
        });
      });
    }
  }

  /**
   * Get the next available token with rate limit remaining
   * @param minRemaining Minimum number of API calls needed
   * @returns Token with available rate limit or null if none available
   */
  private async getNextValidToken(minRemaining: number = 1): Promise<string | null> {
    if (this.tokens.length === 0) return null;

    const startIndex = this.currentTokenIndex;
    let checkedAllTokens = false;

    do {
      const token = this.tokens[this.currentTokenIndex];
      try {
        // Check current rate limit for token
        const rateLimit = await this.checkTokenRateLimit(token);
        
        if (rateLimit.remaining >= minRemaining) {
          return token;
        }

        this.logger.debug(`Token ${this.currentTokenIndex + 1} has insufficient remaining calls (${rateLimit.remaining}), checking next token`);
        
        // Move to next token
        this.currentTokenIndex = (this.currentTokenIndex + 1) % this.tokens.length;
        
        // Check if we've looked at all tokens
        if (this.currentTokenIndex === startIndex) {
          checkedAllTokens = true;
        }
      } catch (error) {
        this.logger.error(`Error checking rate limit for token ${this.currentTokenIndex + 1}: ${error.message}`);
        this.currentTokenIndex = (this.currentTokenIndex + 1) % this.tokens.length;
      }
    } while (!checkedAllTokens);

    // If we get here, no tokens have sufficient remaining calls
    const nextReset = this.findEarliestReset();
    this.logger.warn(`All tokens exhausted, earliest reset at ${nextReset.toLocaleTimeString()}`);
    return null;
  }

  /**
   * Find the earliest reset time among all tokens
   */
  private findEarliestReset(): Date {
    let earliest = new Date(8640000000000000); // Max date
    for (const limit of this.tokenRateLimits.values()) {
      if (limit.reset < earliest) {
        earliest = limit.reset;
      }
    }
    return earliest;
  }

  /**
   * Check rate limit for a specific token
   */
  private async checkTokenRateLimit(token: string): Promise<{ remaining: number; reset: Date; graphqlRemaining: number }> {
    try {
      const headers = { Authorization: `bearer ${token}` };
      const response = await firstValueFrom(
        this.httpService.get(`${this.GITHUB_API_URL}/rate_limit`, { headers })
      );
      
      const restRateLimit = response.data.resources.core;
      const graphqlRateLimit = response.data.resources.graphql;
      
      const rateLimit = {
        remaining: restRateLimit.remaining,
        reset: new Date(restRateLimit.reset * 1000),
        graphqlRemaining: graphqlRateLimit.remaining
      };
      
      // Update stored rate limit
      this.tokenRateLimits.set(token, rateLimit);
      
      return rateLimit;
    } catch (error) {
      this.logger.error(`Failed to check rate limit for token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute an operation with token rotation and backoff
   */
  private async withTokenRotation<T>(operation: (headers: Record<string, string>) => Promise<T>, minRemaining: number = 1): Promise<T> {
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      const token = await this.getNextValidToken(minRemaining);
      if (!token) {
        const waitTime = Math.pow(2, retries) * 1000;
        this.logger.warn(`No tokens available, backing off for ${waitTime}ms before retry ${retries + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }

      try {
        const headers = { Authorization: `bearer ${token}` };
        return await operation(headers);
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 429) {
          // Update rate limit on error
          await this.checkTokenRateLimit(token).catch(() => {});
          retries++;
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }


  /**
   * Calculate GitHub score for a user
   * @param username GitHub username
   * @returns GitHub score
   */
  async calculateScore(username: string): Promise<GitHubScore> {
    try {
      this.logger.trace('Starting GitHub score calculation', { username });
      
      // Get repositories and contributions
      const userResponse = await this.getUserData(username);
      
      if (!userResponse) {
        this.logger.warn('No GitHub data found for user', { username });
        return {
          total: 0,
          totalScore: 0,
          domainScore: 0,
          contributionScore: 0,
          domains: {},
          technologies: [],
          error: `No GitHub data found for user: ${username}`
        };
      }

      // Get contributions
      const contributions = await this.getContributions(username);
      
      // Map technologies to domains
      const domainCount = this.domainService.mapTechnologiesToDomains(userResponse.technologies);
      
      // Calculate scores
      const domainScore = this.calculateDomainScore(Object.keys(domainCount) as Domain[]) +
                          this.calculateExtraDomainScore(domainCount);
      
      const contributionScore = this.calculateContributionScore(
        contributions ? contributions.totalContributions : 0
      );
      
      return {
        total: domainScore + contributionScore,
        totalScore: domainScore + contributionScore,
        domainScore,
        contributionScore,
        domains: domainCount,
        technologies: userResponse.technologies,
      };
    } catch (error) {
      this.logger.error('GitHub score calculation failed', {
        username,
        error: error.message,
        stack: error.stack
      });
      // Return a default score with error instead of throwing
      return {
        total: 0,
        totalScore: 0,
        domainScore: 0,
        contributionScore: 0,
        domains: {},
        technologies: [],
        error: `Error calculating score: ${error.message}`
      };
    }
  }

  /**
   * Get GitHub user data
   * @param username GitHub username
   * @returns GitHub user response
   */
  async getUserData(username: string): Promise<GitHubUserResponse | null> {
    try {
      this.logger.trace('Starting GitHub user data fetch', { username });
      
      this.logger.debug('Fetching user repositories', {
        url: `${this.GITHUB_API_URL}/users/${username}/repos`,
        hasAuth: this.tokens.length > 0
      });
      
      // Get repositories with token rotation
      const reposResponse = await this.withTokenRotation(headers => 
        firstValueFrom(
          this.httpService.get(`${this.GITHUB_API_URL}/users/${username}/repos`, { headers })
        )
      );
      
      const repos = reposResponse.data as any[];
      
      // Filter repositories
      const filteredRepos = await this.filterGithubRepos(repos);
      
      if (filteredRepos.length === 0) {
        this.logger.warn('No valid repositories found after filtering', { username });
        return null;
      }
      
      const technologies: string[] = [];
      const userRepoInfo = [];
      
      // Process each repository
      for (const repo of filteredRepos) {
        try {
          // Get languages for repository with token rotation
          const languagesResponse = await this.withTokenRotation(headers => 
            firstValueFrom(
              this.httpService.get(`${this.GITHUB_API_URL}/repos/${username}/${repo.name}/languages`, { headers })
            )
          );
          
          const languages = languagesResponse.data as Record<string, number>;
          
          if (Object.keys(languages).length > 0) {
            // Get commits for repository with token rotation
            const commitsResponse = await this.withTokenRotation(headers => 
              firstValueFrom(
                this.httpService.get(`${this.GITHUB_API_URL}/repos/${username}/${repo.name}/commits`, { headers })
              )
            );
            
            const commits = commitsResponse.data as any[];
            
            // Calculate language percentages
            const totalBytes = Object.values(languages).reduce(
              (total: number, bytes: number) => total + bytes,
              0
            );
            
            const languagePercentages: Record<string, string> = {};
            
            for (const [language, bytes] of Object.entries(languages)) {
              languagePercentages[language] = ((bytes / totalBytes) * 100).toFixed(2);
              technologies.push(language.toUpperCase());
            }
            
            // Add repository info
            userRepoInfo.push({
              repoName: repo.name,
              commit: commits.length,
              languages: languagePercentages,
            });
          }
        } catch (error) {
          this.logger.warn(`Error processing repo ${repo.name}: ${error.message}`);
          continue;
        }
      }
      
      return {
        technologies: [...new Set(technologies)], // Remove duplicates
        user_repo_info: userRepoInfo,
        repo_count: filteredRepos.length,
      };
    } catch (error) {
      this.logger.error('GitHub user data fetch failed', {
        username,
        error: error.message,
        status: error.response?.status,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Get GitHub contributions using GraphQL API
   * @param username GitHub username
   * @returns Contribution data
   */
  async getContributions(username: string): Promise<Contribution | null> {
    try {
      this.logger.trace('Starting GitHub contributions fetch', { username });
      
      const fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 2);
      
      this.logger.debug('Fetching contributions via GraphQL', {
        username,
        fromDate: fromDate.toISOString(),
        hasAuth: this.tokens.length > 0
      });
      
      const query = `
        query($username: String!, $from: DateTime!) {
          user(login: $username) {
            contributionsCollection(from: $from) {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          }
        }
      `;

      const variables = { 
        username,
        from: fromDate.toISOString() 
      };
      
      // Make GraphQL request to GitHub API with token rotation
      const response = await this.withTokenRotation(headers => 
        firstValueFrom(
          this.httpService.post(
            `${this.GITHUB_API_URL}/graphql`,
            { query, variables },
            { 
              headers: {
                ...headers,
                'Content-Type': 'application/json'
              } 
            }
          )
        ),
        5 // Require at least 5 remaining calls for GraphQL operations
      );
      
      // Check for GraphQL errors
      if (response.data?.errors) {
        const errorMessages = response.data.errors.map((e: any) => e.message).join(', ');
        this.logger.error(`GraphQL errors: ${errorMessages}`);
        return null;
      }
      
      // Check if user exists and has contribution data
      if (!response.data?.data?.user) {
        this.logger.warn(`No GitHub user found for username: ${username}`);
        return null;
      }
      
      const contributionCalendar = response.data.data.user.contributionsCollection.contributionCalendar;
      const totalContributions = contributionCalendar.totalContributions;
      
      this.logger.debug(`Found ${totalContributions} contributions for user ${username}`);
      
      // Extract contribution days from weeks
      const contributionDays: ContributionDay[] = [];
      for (const week of contributionCalendar.weeks) {
        for (const day of week.contributionDays) {
          contributionDays.push({
            date: day.date,
            contributionCount: day.contributionCount
          });
        }
      }
      
      return {
        totalContributions,
        contributions: contributionDays,
      };
    } catch (error) {
      this.logger.error('GitHub contributions fetch failed', {
        username,
        error: error.message,
        status: error.response?.status,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Check if a repository contains valid code files
   * @param username GitHub username
   * @param repoName Repository name
   * @returns True if repository contains code files, false otherwise
   */
  private async isValidRepository(username: string, repoName: string): Promise<boolean> {
    try {
      // Get repository contents
      const contentsResponse = await this.withTokenRotation(headers =>
        firstValueFrom(
          this.httpService.get(`${this.GITHUB_API_URL}/repos/${username}/${repoName}/contents`, { headers })
        )
      );
      
      const contents = contentsResponse.data;
      
      // Check if repository is empty
      if (!contents || contents.length === 0) {
        this.logger.debug(`Repository ${repoName} is empty`);
        return false;
      }
      
      // Check if repository only contains non-code files
      const hasCodeFiles = contents.some(file => {
        if (file.type !== 'file') return true; // Consider directories as potential code containers
        const extension = path.extname(file.name).toLowerCase();
        return !NON_CODE_FILE_EXTENSIONS.includes(extension);
      });
      
      if (!hasCodeFiles) {
        this.logger.debug(`Repository ${repoName} contains only non-code files`);
      }
      
      return hasCodeFiles;
    } catch (error) {
      this.logger.warn(`Error checking repository contents for ${repoName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Filter GitHub repositories
   * @param repos List of repositories
   * @returns Filtered repositories
   */
  private async filterGithubRepos(repos: any[]): Promise<any[]> {
    const filteredRepos = [];
    
    for (const repo of repos) {
      // Skip if repo matches ignore patterns or is a fork
      if (IGNORE_GITHUB_REPOS.some(removeRepo => {
        const repoName = repo.name.toLowerCase();
        const removeCondition = removeRepo.toLowerCase();
        return (
          repoName.startsWith(removeCondition) ||
          repoName.includes(removeCondition) ||
          repo.fork
        );
      })) {
        this.logger.debug(`Skipping repository ${repo.name} (matches ignore pattern or is fork)`);
        continue;
      }
      
      // Check if repository has valid code files
      if (await this.isValidRepository(repo.owner.login, repo.name)) {
        filteredRepos.push(repo);
      }
    }
    
    return filteredRepos;
  }

  /**
   * Calculate domain score
   * @param domains List of domains
   * @returns Domain score
   */
  private calculateDomainScore(domains: Domain[]): number {
    let score = 0;

    if (domains.includes(Domain.FULL_STACK)) {
      score += 16;
    } else {
      if (domains.includes(Domain.FRONTEND)) {
        score += 8;
      }
      if (domains.includes(Domain.BACKEND)) {
        score += 8;
      }
    }
    
    if (domains.includes(Domain.DATA)) {
      score += 8;
    }
    
    if (domains.includes(Domain.MOBILE_DEVELOPMENT)) {
      score += 8;
    }
    
    if (domains.includes(Domain.DEVOPS)) {
      score += 8;
    }

    return score;
  }

  /**
   * Calculate extra domain score
   * @param domainCount Domain count record
   * @returns Extra domain score
   */
  private calculateExtraDomainScore(domainCount: DomainCount): number {
    let score = 0;

    for (const domain in domainCount) {
      if (domain === Domain.OTHERS) {
        score += domainCount[domain].split(',').length;
      } else {
        score += (domainCount[domain].split(',').length - 1) * 3;
      }
    }

    if (Domain.FULL_STACK in domainCount) {
      if (Domain.FRONTEND in domainCount) score += 3;
      if (Domain.BACKEND in domainCount) score += 3;
    }

    return score > 40 ? 40 : score;
  }

  /**
   * Calculate contribution score
   * @param totalContributions Total number of contributions
   * @returns Contribution score
   */
  private calculateContributionScore(totalContributions: number): number {
    let score = 0;
    
    if (totalContributions > 200) {
      score += 20;
    }
    else if (totalContributions > 150) {
      score += 17;
    } 
    else if (totalContributions > 100) {
      score += 15;
    } else if (totalContributions > 75) {
      score += 10;
    } else if (totalContributions > 50) {
      score += 5;
    } else if (totalContributions >= 25) {
      score += 3;
    }

    return score;
  }

  /**
   * Extract GitHub username from URL
   * @param url GitHub URL
   * @returns GitHub username
   */
  extractGithubUsername(url: string): string | null {
    if (!url) return null;
    
    const regex = /github\.com\/([^/?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Check GitHub API rate limit status
   * @returns Rate limit information
   */
  async checkRateLimit(): Promise<{ limit: number; remaining: number; reset: Date; graphqlRemaining?: number }> {
    try {
      // Return combined rate limit info for all tokens
      const limits = Array.from(this.tokenRateLimits.values());
      return {
        limit: limits.reduce((sum, l) => sum + 5000, 0), // 5000 is default GitHub limit per token
        remaining: limits.reduce((sum, l) => sum + l.remaining, 0),
        reset: this.findEarliestReset(),
        graphqlRemaining: limits.reduce((sum, l) => sum + l.graphqlRemaining, 0)
      };
    } catch (error) {
      this.logger.error('GitHub rate limit check failed', {
        error: error.message,
        status: error.response?.status,
        stack: error.stack
      });
      throw error;
    }
  }
}
