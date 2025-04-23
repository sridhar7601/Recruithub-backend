import { Injectable } from '@nestjs/common';
import { CustomLogger } from '../utils/custom.logger';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { WeCPData } from '../../../../student/src/lib/student.schema';

interface WecpCandidate {
  candidateId: string;
  candidateDetails: {
    Name?: string;
    Email?: string;
    'Github URL'?: string;
    registrationNumber?: string; // Optional since it might not exist
    [key: string]: any;
  };
  percentage: number;
  testFinished?: boolean;
  testStartTime?: string;
  testDuration?: string;
  [key: string]: any;
}

interface WecpCandidateDetails {
  candidateId: string;
  programmingLanguagesUsed?: string[];
  finishTime?: string;
  candidateDetails: {
    Name?: string;
    Email?: string;
    'Github URL'?: string;
    [key: string]: any;
  };
  score: number;
  maxScore: number;
  questionWiseScore?: any;
  testStartTime: string;
  testFinished: boolean;
  testDuration: string;
  reportLink?: string;
  quizId?: string;
  retry?: number;
  finished?: boolean;
  proctoringData?: any;
  closed?: number;
  [key: string]: any;
}

@Injectable()
export class WecpService {
  private readonly logger = new CustomLogger(WecpService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('WECP_API_URL');
    this.apiKey = this.configService.get<string>('WECP_API_KEY');
    
    if (!this.apiKey) {
      this.logger.warn('WECP_API_KEY is not configured');
    }
    
    if (!this.apiUrl) {
      this.logger.warn('WECP_API_URL is not configured');
    }
  }

  /**
   * Fetch candidates from WeCP API for a specific test
   * @param testId The WeCP test ID
   * @returns Array of candidates with their details and scores
   */
  async fetchCandidates(testId: string): Promise<WecpCandidate[]> {
    try {
      this.logger.trace('Starting WeCP candidate fetch', { testId });
      
      // Log the request details for debugging
      this.logger.debug('WeCP API request details', {
        url: `${this.apiUrl}/${testId}/candidates`,
        apiKey: this.apiKey ? '****' + this.apiKey.substring(this.apiKey.length - 4) : 'Not set',
        method: 'GET'
      });
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/${testId}/candidates`, {
          headers: {
            'x-api-key': this.apiKey
          }
        })
      );
      
      this.logger.debug('WeCP API response received', {
        testId,
        candidateCount: response.data.length,
        status: response.status
      });
      
      this.logger.log(`Retrieved ${response.data.length} candidates from WeCP test: ${testId}`);
      return response.data;
    } catch (error) {
      // Check if it's a 404 with "No candidate found" message
      if (error.response && error.response.status === 404 && 
          error.response.data === "No candidate found") {
        this.logger.warn(`No candidates found for WeCP test: ${testId}`);
        return []; // Return empty array instead of throwing error
      }
      
      this.logger.error('WeCP API request failed', {
        testId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      throw new Error(`Failed to fetch candidates from WeCP: ${error.message}`);
    }
  }

  /**
   * Get the top percentage of candidates and calculate average score
   * @param candidates List of candidates from WeCP
   * @param topPercentage Percentage of top candidates to consider (0-1)
   * @returns Average percentage of top candidates
   */
  calculateTopCandidatesAverage(candidates: WecpCandidate[], topPercentage: number = 0.2): number {
    if (!candidates || candidates.length === 0) {
      return 0;
    }
    
    // Sort candidates by percentage (descending)
    const sortedCandidates = [...candidates].sort((a, b) => b.percentage - a.percentage);
    
    // Get top candidates
    const topCount = Math.max(1, Math.floor(candidates.length * topPercentage));
    const topCandidates = sortedCandidates.slice(0, topCount);
    
    // Calculate average
    const totalPercentage = topCandidates.reduce((sum, candidate) => sum + candidate.percentage, 0);
    return totalPercentage / topCandidates.length;
  }

  /**
   * Fetch detailed information for a specific candidate
   * @param candidateId The WeCP candidate ID
   * @returns Detailed candidate information
   */
  async fetchCandidateDetails(candidateId: string): Promise<WecpCandidateDetails> {
    try {
      this.logger.trace('Starting WeCP candidate details fetch', { candidateId });
      
      const requestUrl = `https://api.wecreateproblems.com/ats/wecp/candidates/${candidateId}`;
      this.logger.debug('WeCP API request details', {
        url: requestUrl,
        apiKey: this.apiKey ? '****' + this.apiKey.substring(this.apiKey.length - 4) : 'Not set',
        method: 'GET'
      });
      
      const response = await firstValueFrom(
        this.httpService.get(requestUrl, {
          headers: {
            'x-api-key': this.apiKey
          }
        })
      );
      
      this.logger.debug('WeCP API response received', {
        candidateId,
        status: response.status,
        hasData: !!response.data
      });
      
      this.logger.debug(`Retrieved details for WeCP candidate: ${candidateId}`);
      return response.data;
    } catch (error) {
      this.logger.error('WeCP API candidate details request failed', {
        candidateId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      throw new Error(`Failed to fetch candidate details from WeCP: ${error.message}`);
    }
  }

  /**
   * Transform WeCP candidate details to WeCPData format
   * @param candidateDetails The WeCP candidate details
   * @returns Transformed WeCPData object
   */
  transformToWeCPData(candidateDetails: WecpCandidateDetails): WeCPData {
    // Calculate percentage
    const percentage = candidateDetails.maxScore > 0 
      ? (candidateDetails.score / candidateDetails.maxScore) * 100 
      : 0;
    
    return {
      candidateId: candidateDetails.candidateId,
      percentage: parseFloat(percentage.toFixed(2)),
      programmingLanguagesUsed: candidateDetails.programmingLanguagesUsed || [],
      testStartTime: new Date(candidateDetails.testStartTime),
      testDuration: candidateDetails.testDuration,
      testFinished: candidateDetails.testFinished,
      reportLink: candidateDetails.reportLink,
      raw: candidateDetails
    };
  }
}
