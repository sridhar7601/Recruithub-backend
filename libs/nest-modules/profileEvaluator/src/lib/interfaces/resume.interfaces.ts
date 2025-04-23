/**
 * Resume score interfaces
 */

export interface BackgroundBonus {
  points: number;
  breakdown: {
    fullStackProficiency: number;
    additionalSkills: number;
  };
  justification: string;
}

export interface StackAnalysis {
  frontend: {
    score: number;
    technologies: string[];
    expertise: string;
  };
  backend: {
    score: number;
    technologies: string[];
    expertise: string;
  };
  database: {
    score: number;
    technologies: string[];
    expertise: string;
  };
  infrastructure: {
    score: number;
    technologies: string[];
    expertise: string;
  };
  aiMl?: {
    score: number;
    technologies: string[];
    expertise: string;
    frameworks: string[];
    modelTypes: string[];
  };
  genAi?: {
    score: number;
    technologies: string[];
    expertise: string;
    implementations: string[];
  };
  domainSpecific?: {
    background: string;
    relevantSkills: string[];
    crossDomainApplications: string[];
  };
}

export interface ProjectHighlights {
  bestProjects: string[];
  technicalComplexity: string;
  architecturalPatterns: string[];
  aiMlComponents?: string[];
  domainInfluence?: string[];
  uniquePerspectives?: string[];
}

export interface CareerReadiness {
  level: string;
  strengths: string[];
  areasForImprovement: string[];
  backgroundLeverage?: string;
  aiIntegrationCapability?: string;
}

export interface ResumeScore {
  totalScore: number;
  baseScore: number;
  backgroundBonus: BackgroundBonus;
  technicalFoundationScore: number;
  projectsPracticalExperienceScore: number;
  learningAdaptabilityScore: number;
  summary: string;
  standoutFactors: string;
  stackAnalysis: StackAnalysis;
  projectHighlights: ProjectHighlights;
  careerReadiness: CareerReadiness;
  recommendedRoles: string[];
  growthPotential: string;
  error?: string;
}
