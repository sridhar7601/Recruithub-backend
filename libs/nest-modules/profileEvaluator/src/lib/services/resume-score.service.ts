import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BedrockEmbeddings, ChatBedrockConverse } from "@langchain/aws";
import { BaseMessage } from "@langchain/core/messages";
import axios from 'axios';
import { PdfReader } from 'pdfreader';
import { ResumeScore } from '../interfaces/resume.interfaces';
import { BENCHMARK_RESUME } from '../constants/benchmark-resume.constants';

@Injectable()
export class ResumeScoreService {
  private readonly logger = new Logger(ResumeScoreService.name);
  private readonly chatModel: ChatBedrockConverse;

  constructor(private readonly configService: ConfigService) {
    this.chatModel = new ChatBedrockConverse({
      model: "anthropic.claude-3-5-sonnet-20240620-v1:0",
      region: this.configService.get<string>('AWS_REGION') || 'us-west-2',
    });
  }

  /**
   * Evaluate a resume and return a score
   * @param resumeText The text content of the resume
   * @param studentDegree The student's degree for background bonus calculation
   * @returns Resume score
   */
  async evaluateResume(resumeText: string, studentDegree: string): Promise<ResumeScore> {
    try {
      this.logger.log(`Evaluating resume for student with degree: ${studentDegree}`);
      
      const prompt = this.constructPrompt(resumeText, studentDegree);
      const response = await this.invokeBedrockModel(prompt);
      
      return this.parseResponse(response);
    } catch (error: any) {
      this.logger.error(`Error evaluating resume: ${error?.message || 'Unknown error'}`);
      
      // Return a default score with error
      return {
        totalScore: 0,
        baseScore: 0,
        backgroundBonus: {
          points: 0,
          breakdown: {
            fullStackProficiency: 0,
            additionalSkills: 0
          },
          justification: 'Error during evaluation'
        },
        technicalFoundationScore: 0,
        projectsPracticalExperienceScore: 0,
        learningAdaptabilityScore: 0,
        summary: 'Error evaluating resume',
        standoutFactors: 'None due to evaluation error',
        stackAnalysis: {
          frontend: { score: 0, technologies: [], expertise: 'LOW' },
          backend: { score: 0, technologies: [], expertise: 'LOW' },
          database: { score: 0, technologies: [], expertise: 'LOW' },
          infrastructure: { score: 0, technologies: [], expertise: 'LOW' },
          aiMl: { score: 0, technologies: [], expertise: 'LOW', frameworks: [], modelTypes: [] },
          genAi: { score: 0, technologies: [], expertise: 'LOW', implementations: [] },
          domainSpecific: { background: '', relevantSkills: [], crossDomainApplications: [] }
        },
        projectHighlights: {
          bestProjects: [],
          technicalComplexity: 'LOW',
          architecturalPatterns: [],
          aiMlComponents: [],
          domainInfluence: [],
          uniquePerspectives: []
        },
        careerReadiness: {
          level: 'LOW',
          strengths: [],
          areasForImprovement: ['Resume evaluation failed'],
          backgroundLeverage: 'None',
          aiIntegrationCapability: 'None'
        },
        recommendedRoles: [],
        growthPotential: 'Unknown due to evaluation error',
        error: error.message
      };
    }
  }

  /**
   * Process a batch of resumes in parallel
   * @param resumeUrls Array of Google Drive URLs to resumes
   * @param degrees Array of student degrees corresponding to the resumes
   * @returns Array of resume scores
   */
  async processResumeBatch(resumeUrls: string[], degrees: string[]): Promise<ResumeScore[]> {
    if (resumeUrls.length !== degrees.length) {
      throw new Error('Number of resume URLs must match number of degrees');
    }

    const batchSize = this.configService.get<number>('RESUME_PARALLEL_LIMIT') || 5;
    const results: ResumeScore[] = [];

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < resumeUrls.length; i += batchSize) {
      const batchUrls = resumeUrls.slice(i, i + batchSize);
      const batchDegrees = degrees.slice(i, i + batchSize);

      this.logger.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(resumeUrls.length / batchSize)} (${batchUrls.length} resumes)`);

      // Extract text from PDFs
      const textPromises = batchUrls.map(url => this.extractTextFromPDF(url));
      const resumeTexts = await Promise.all(textPromises);

      // Evaluate resumes
      const scorePromises = resumeTexts.map((text, index) => 
        this.evaluateResume(text, batchDegrees[index])
      );
      const batchResults = await Promise.all(scorePromises);

      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < resumeUrls.length) {
        this.logger.log('Adding delay between batches');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  /**
   * Extract text from a PDF file
   * @param driveUrl Google Drive URL to the PDF
   * @returns Extracted text
   */
  async extractTextFromPDF(driveUrl: string): Promise<string> {
    try {
      const fileId = this.extractFileId(driveUrl);
      
      if (!fileId) {
        throw new Error(`Invalid Google Drive URL: ${driveUrl}`);
      }
      
      // Generate direct download link
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      // Download the PDF
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer'
      });
      
      // Convert buffer to temporary file
      return new Promise((resolve, reject) => {
        let text = '';
        
        // Create PDF reader instance
        const reader = new PdfReader();
        
        // Parse PDF buffer
        reader.parseBuffer(response.data, (err, item) => {
          if (err) {
            reject(new Error(`Error parsing PDF: ${err}`));
          } else if (!item) {
            // End of file - resolve with collected text
            resolve(this.sanitizeText(text));
          } else if (item.text) {
            // Append text content
            text += item.text + ' ';
          }
        });
      });
    } catch (error: any) {
      this.logger.error(`Error extracting text from PDF: ${error?.message || 'Unknown error'}`);
      throw new Error(`Failed to extract text from PDF: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Extract file ID from Google Drive URL
   * @param driveUrl Google Drive URL
   * @returns File ID
   */
  private extractFileId(driveUrl: string): string | null {
    if (driveUrl.includes('drive.google.com/file/d/')) {
      const fileIdMatch = driveUrl.match(/\/d\/(.*?)\//);
      return fileIdMatch ? fileIdMatch[1] : null;
    }
    return null;
  }

  /**
   * Sanitize text for AI processing
   * @param text Raw text
   * @returns Sanitized text
   */
  private sanitizeText(text: string): string {
    // Remove unnecessary newlines
    let sanitized = text.replace(/\n+/g, ' ');
    
    // Remove non-UTF-8 characters
    sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');
    
    // Escape special characters
    sanitized = sanitized
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\/n/g, '')
      .replace(/\+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return sanitized;
  }

  /**
   * Invoke the Bedrock model with the given prompt
   * @param prompt The prompt to send to the model
   * @returns The model's response
   */
  private async invokeBedrockModel(prompt: string): Promise<string> {
    try {
      const response = await this.chatModel.invoke(prompt);
      if (Array.isArray(response)) {
        return (response[0] as BaseMessage).content.toString();
      }
      return (response as BaseMessage).content.toString();
    } catch (error: any) {
      this.logger.error(`Error invoking Bedrock model: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Parse the response from the model
   * @param response The model's response
   * @returns The parsed resume score
   */
  private parseResponse(response: string): ResumeScore {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const jsonString = jsonMatch[0];
      const parsedResponse = JSON.parse(jsonString);
      
      // Validate the response
      if (!parsedResponse.totalScore) {
        throw new Error('Invalid response format: missing totalScore');
      }
      
      return parsedResponse;
    } catch (error: any) {
      this.logger.error(`Error parsing response: ${error?.message || 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Construct prompt for Claude 3.5 Sonnet
   * @param resumeText Resume text
   * @param studentDegree Student's degree
   * @returns Prompt for Claude
   */
  private constructPrompt(resumeText: string, studentDegree: string): string {
    return `You are an expert AI Hiring Agent specializing in campus placements for technology companies. Your task is to evaluate candidates for Full Stack Developer positions who can work across UI, Backend, Data, Infrastructure, and AI/ML layers. Analyze this resume using a 100-point scoring system.

Resume to evaluate:
${resumeText.trim()}

Student's Degree: ${studentDegree}

IMPORTANT: Add bonus points for candidates from:
- Electronics and Communication Engineering (ECE)
- Electrical and Electronics Engineering (EEE)
- Mechanical Engineering
- Mechatronics
- Other non-CS engineering branches

Bonus Point Structure (Maximum total: 5 points):
1. Full Stack Development Proficiency (up to 3 points)
   - Strong full-stack projects: +2 points
   - Production deployments: +1 point

2. Additional Technical Skills (up to 2 points)
   - AI/ML implementation: +1 point
   - Domain-specific integration: +1 point
   
Note: Total bonus points cannot exceed 5 points and should only be awarded for exceptional demonstrations of software development skills.

EVALUATION FRAMEWORK:

1. Technical Foundation (35 points)
   A. Full Stack Capabilities (15 points)
      - Frontend Development (4 points)
        * Look for: React/Angular/Vue.js experience
        * Consider: UI/UX, responsive design, state management
      
      - Backend Development (4 points)
        * Look for: Node.js/Java/Python backend experience
        * Consider: API design, authentication, authorization
      
      - Database & Data Modeling (4 points)
        * Look for: SQL and NoSQL database experience
        * Consider: Schema design, query optimization
      
      - Infrastructure & DevOps (3 points)
        * Look for: Cloud platforms, CI/CD, containerization

   B. AI/ML Capabilities (10 points)
      - Machine Learning (5 points)
        * Look for: ML frameworks (TensorFlow, PyTorch)
        * Consider: Model training, data preprocessing
        * Key skills: Python, scikit-learn, neural networks
      
      - Generative AI Integration (5 points)
        * Look for: LLM integration experience
        * Consider: Prompt engineering, AI APIs
        * Key skills: OpenAI, Hugging Face, LangChain
        * Bonus: Fine-tuning, RAG implementations

   C. Core Engineering Skills (10 points)
      - Data Structures & Algorithms (3 points)
      - System Design & Architecture (4 points)
      - Version Control & Collaboration (3 points)

2. Projects & Experience (40 points)
   A. Full Stack Projects (20 points)
      - End-to-End Implementation (8 points)
        * Look for: Complete application development
      
      - AI/ML Integration (7 points)
        * Look for: ML model deployment
        * Consider: AI features in applications
        * Key aspects: Model serving, API integration
      
      - Architecture & DevOps (5 points)
        * Look for: Microservices, containerization

   B. AI/ML Projects (10 points)
      - Machine Learning Projects (5 points)
        * Look for: Model development, training
        * Consider: Dataset handling, evaluation
      
      - GenAI Applications (5 points)
        * Look for: LLM-based applications
        * Consider: Prompt engineering, RAG systems

   C. Technical Achievements (10 points)
      - Hackathons/Competitions (4 points)
      - Open Source Contributions (3 points)
      - Innovation & Research (3 points)

3. Learning & Adaptability (25 points)
   A. Technical Learning (15 points)
      - Modern Stack Adoption (5 points)
      - AI/ML Learning Path (5 points)
        * Look for: AI/ML courses, certifications
        * Consider: Kaggle competitions, research papers
      - Technology Diversity (5 points)

   B. Soft Skills & Collaboration (10 points)
      - Team Projects (5 points)
      - Communication (5 points)

CRITICAL EVALUATION AREAS:
1. Full Stack + AI Integration
   - Ability to integrate AI/ML into web applications
   - Understanding of ML deployment workflows
   - Experience with AI APIs and services

2. Technical Depth
   - Balance of web development and AI skills
   - Practical implementation experience
   - Modern architecture understanding

3. AI/ML Proficiency
   - Understanding of ML fundamentals
   - Experience with GenAI applications
   - Data processing capabilities

BACKGROUND-SPECIFIC CONSIDERATIONS:
ECE/EEE Students:
- Strong points: Signal processing, embedded systems
- Value-add: Hardware-software integration
- Look for: IoT projects, embedded ML

Mechanical/Mechatronics:
- Strong points: System design, 3D modeling
- Value-add: Physical system simulation
- Look for: Robotics, automation projects

SCORING ADJUSTMENTS:
1. Base Score: Calculate according to standard criteria (max 95)
2. Background Bonus: 
   - Identify engineering background
   - Assess technical implementations
   - Add bonus points (max 5)
3. Final Score: Base + Background Bonus (max 100)

BENCHMARK COMPARISON:
Compare against these full-stack profiles:
${BENCHMARK_RESUME ? BENCHMARK_RESUME[0]?.trim() : ''}
${BENCHMARK_RESUME ? BENCHMARK_RESUME[1]?.trim() : ''}

Return your evaluation in this exact JSON format:
{
  "totalScore": number,
  "baseScore": number,
  "backgroundBonus": {
    "points": number,
    "breakdown": {
      "fullStackProficiency": number,
      "additionalSkills": number
    },
    "justification": string
  },
  "technicalFoundationScore": number,
  "projectsPracticalExperienceScore": number,
  "learningAdaptabilityScore": number,
  "summary": "Two-line summary focusing on full-stack and AI capabilities",
  "standoutFactors": "Key achievements across full-stack and AI domains",
  "stackAnalysis": {
    "frontend": {
      "score": number,
      "technologies": string[],
      "expertise": "HIGH|MEDIUM|LOW"
    },
    "backend": {
      "score": number,
      "technologies": string[],
      "expertise": "HIGH|MEDIUM|LOW"
    },
    "database": {
      "score": number,
      "technologies": string[],
      "expertise": "HIGH|MEDIUM|LOW"
    },
    "infrastructure": {
      "score": number,
      "technologies": string[],
      "expertise": "HIGH|MEDIUM|LOW"
    },
    "aiMl": {
      "score": number,
      "technologies": string[],
      "expertise": "HIGH|MEDIUM|LOW",
      "frameworks": string[],
      "modelTypes": string[]
    },
    "genAi": {
      "score": number,
      "technologies": string[],
      "expertise": "HIGH|MEDIUM|LOW",
      "implementations": string[]
    },
    "domainSpecific": {
      "background": string,
      "relevantSkills": string[],
      "crossDomainApplications": string[]
    }
  },
  "projectHighlights": {
    "bestProjects": string[],
    "technicalComplexity": "HIGH|MEDIUM|LOW",
    "architecturalPatterns": string[],
    "aiMlComponents": string[],
    "domainInfluence": string[],
    "uniquePerspectives": string[]
  },
  "careerReadiness": {
    "level": "HIGH|MEDIUM|LOW",
    "strengths": string[],
    "areasForImprovement": string[],
    "backgroundLeverage": string,
    "aiIntegrationCapability": string
  },
  "recommendedRoles": string[],
  "growthPotential": string
}

Focus on evaluating the candidate's ability to:
1. Build complete applications with AI/ML components
2. Work across all layers including AI integration
3. Understand and implement modern AI architectures
4. Deploy and maintain ML models in production
5. Keep up with rapidly evolving AI technologies`;
  }
}
