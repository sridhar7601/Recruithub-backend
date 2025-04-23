export interface AIScoreComponents {
  github: {
    fullStack: number;
    aiml: number;
    contribution: number;
  };
  resume: {
    fullStack: {
      frontend: number;
      backend: number;
      database: number;
      infrastructure: number;
    };
    aiml: {
      core: number;
      genai: number;
    };
  };
}

export interface AIExpertise {
  fullStack: 'HIGH' | 'MEDIUM' | 'LOW';
  aiml: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AIScore {
  total: number;
  components: AIScoreComponents;
  expertise: AIExpertise;
}

export interface AIScoreInput {
  github: any;  // GitHub details
  resume: any;  // Resume score
}
