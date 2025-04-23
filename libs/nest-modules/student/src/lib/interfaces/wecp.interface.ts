export interface WecpQuestion {
  score: number;
  maxScore: number;
  timeSpent: number;
  totalAttempts: number;
  type: string;
  status: boolean;
  versionId: string;
}

export interface WecpProgrammingQuestion extends WecpQuestion {
  language: string;
  testcasesPassed: number;
}

export interface WecpMCQQuestion extends WecpQuestion {
  status: boolean;
}
