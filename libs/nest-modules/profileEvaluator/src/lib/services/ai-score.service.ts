import { Injectable, Logger } from '@nestjs/common';
import { AIScore } from '../../../../../interfaces/src';
import { Domain } from '../constants/domain.constants';

@Injectable()
export class AIScoreService {
  private readonly logger = new Logger(AIScoreService.name);

  /**
   * Calculate AI score based on GitHub and Resume data
   * @param input Score input data
   * @returns AI score
   */
  async calculateScore(input: { github: any; resume: any }): Promise<AIScore> {
    try {
      // Determine if GitHub profile is available
      const hasGitHub = !input.github?.error;

      // GitHub Component (90% total)
      const githubScore = hasGitHub ? {
        fullStack: this.calculateGitHubFullStackScore(input.github),  // 50%
        aiml: this.calculateGitHubAIMLScore(input.github),           // 20%
        contribution: Math.min(input.github.contributionScore / 100, 1) * 0.2  // 20% (normalized)
      } : {
        fullStack: 0,
        aiml: 0,
        contribution: 0
      };

      // Log scores for debugging
      this.logger.debug('GitHub scores:', {
        fullStack: githubScore.fullStack * 50,
        aiml: githubScore.aiml * 20,
        contribution: githubScore.contribution * 100,
        rawContribution: input.github.contributionScore
      });

      // Resume Component (always 10%)
      const resumeScore = {
        fullStack: {
          frontend: this.normalizeScore(input.resume?.stackAnalysis?.frontend?.score || 0),
          backend: this.normalizeScore(input.resume?.stackAnalysis?.backend?.score || 0),
          database: this.normalizeScore(input.resume?.stackAnalysis?.database?.score || 0),
          infrastructure: this.normalizeScore(input.resume?.stackAnalysis?.infrastructure?.score || 0)
        },
        aiml: {
          core: this.normalizeScore(input.resume?.stackAnalysis?.aiMl?.score || 0),
          genai: this.normalizeScore(input.resume?.stackAnalysis?.genAi?.score || 0)
        }
      };

      // Calculate total score (90% GitHub + 10% Resume)
      const total = Math.min(100, Math.max(0,
        (hasGitHub ? (
          (githubScore.fullStack * 50) +    // 50% of total
          (githubScore.aiml * 20) +         // 20% of total
          (githubScore.contribution * 20)    // 20% of total
        ) : 0) +
        (this.calculateResumeScore(resumeScore) * 10)  // Always 10%
      ));

      return {
        total,
        components: {
          github: githubScore,
          resume: resumeScore
        },
        expertise: {
          fullStack: this.determineExpertiseLevel(total, 'fullStack'),
          aiml: this.determineExpertiseLevel(total, 'aiml')
        }
      };
    } catch (error) {
      this.logger.error(`Error calculating AI score: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate GitHub full stack score
   * @param github GitHub details
   * @returns Score
   */
  private calculateGitHubFullStackScore(github: any): number {
    try {
      let score = 0;
      const domains = typeof github.domains === 'string' 
        ? JSON.parse(github.domains) 
        : github.domains || {};

      // Check for full stack domain
      if (domains[Domain.FULL_STACK]) {
        score += 50; // Full points for full stack
      } else {
        // Check individual components
        if (domains[Domain.FRONTEND]) score += 15;  // 15%
        if (domains[Domain.BACKEND]) score += 20;   // 20%
        if (domains[Domain.DATA]) score += 7;       // 7%
        if (domains[Domain.DEVOPS]) score += 8;     // 8%
      }

      // Add bonus for multiple domains (up to 10 points)
      const domainCount = Object.keys(domains).length;
      if (domainCount > 2) {
        score += Math.min((domainCount - 2) * 5, 10);
      }

      // Normalize to 0-1 range
      return Math.min(score / 100, 1);
    } catch (error) {
      this.logger.error(`Error calculating GitHub full stack score: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate GitHub AI/ML score
   * @param github GitHub details
   * @returns Score
   */
  private calculateGitHubAIMLScore(github: any): number {
    try {
      let score = 0;
      const technologies = (github.technologies || '').split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      // AI/ML related technologies with weights
      const aimlTechnologies = {
        // Core ML frameworks (3 points each)
        'tensorflow': 3,
        'pytorch': 3,
        'scikit-learn': 3,
        'keras': 3,
        
        // Data processing (2 points each)
        'numpy': 2,
        'pandas': 2,
        'jupyter': 2,
        
        // Computer Vision/NLP (2 points each)
        'opencv': 2,
        'nltk': 2,
        'spacy': 2,
        
        // Modern AI tools (3 points each)
        'huggingface': 3,
        'langchain': 3,
        'openai': 3,
        'transformers': 3,
        
        // Supporting technologies (1 point each)
        'python': 1,
        'cuda': 1,
        'matplotlib': 1,
        'seaborn': 1
      };

      // Score based on weighted technology usage
      for (const tech of technologies) {
        if (tech in aimlTechnologies) {
          score += aimlTechnologies[tech];
        }
      }

      // Normalize to 0-1 range (max possible score is ~35)
      return Math.min(score / 35, 1);
    } catch (error) {
      this.logger.error(`Error calculating GitHub AI/ML score: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate resume score
   * @param resumeScore Resume score components
   * @returns Combined score
   */
  private calculateResumeScore(resumeScore: any): number {
    // Full stack components (70% of resume score)
    const fullStackScore = (
      (resumeScore.fullStack.frontend * 0.2) +      // 20%
      (resumeScore.fullStack.backend * 0.3) +       // 30%
      (resumeScore.fullStack.database * 0.2) +      // 20%
      (resumeScore.fullStack.infrastructure * 0.3)  // 30%
    );

    // AI/ML components (30% of resume score)
    const aimlScore = (
      (resumeScore.aiml.core * 0.7) +    // 70%
      (resumeScore.aiml.genai * 0.3)     // 30%
    );

    // Combine scores (70% full stack, 30% AI/ML)
    return (fullStackScore * 0.7) + (aimlScore * 0.3);
  }

  /**
   * Normalize a score to 0-1 range
   * @param score Raw score
   * @returns Normalized score
   */
  private normalizeScore(score: number): number {
    return Math.min(Math.max(score / 10, 0), 1);
  }

  /**
   * Determine expertise level based on score
   * @param score Total score
   * @param type Type of expertise
   * @returns Expertise level
   */
  private determineExpertiseLevel(score: number, type: 'fullStack' | 'aiml'): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Adjust thresholds based on type
    const thresholds = type === 'fullStack' 
      ? { high: 0.75, medium: 0.5 }
      : { high: 0.7, medium: 0.4 };

    if (score >= thresholds.high) return 'HIGH';
    if (score >= thresholds.medium) return 'MEDIUM';
    return 'LOW';
  }
}
