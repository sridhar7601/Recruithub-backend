/**
 * Constants for GitHub score calculation
 */

/**
 * Threshold for prescreening GitHub score
 */
export const PRESCREENING_GITHUB_CUTOFF_SCORE = 50;

/**
 * Average percentage for WeCP evaluation
 */
export const AVERAGE_PERCENTAGE = 0.2; // Top 20%

/**
 * GitHub repositories to ignore
 */
export const IGNORE_GITHUB_REPOS = [
  'test',
  'sample',
  'example',
  'tutorial',
  'demo',
  'template',
  'boilerplate',
  'starter',
];

/**
 * GitHub error messages
 */
export const GITHUB_ERRORS = {
  GITHUB_URL_NOT_GIVEN: 'GitHub URL not provided',
  GITHUB_URL_WRONG: 'Invalid GitHub URL',
  NO_REPOS_FOUND: 'No repositories found',
  NO_VALID_REPOS_FOUND: 'No valid repositories found',
  PROCESSING_ERROR: 'Error processing GitHub data',
  GITHUB_CONTRIBUTION_ERROR: 'Error fetching GitHub contributions',
  INVALID_RESUME_URL: 'Invalid resume URL',
};

/**
 * Language scores (currently not used in the main calculation)
 */
/**
 * File extensions to consider as non-code files
 */
export const NON_CODE_FILE_EXTENSIONS = [
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.bmp',
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // Documentation
  '.md', '.markdown',
  // Other
  '.txt', '.json', '.yml', '.yaml', '.env', '.gitignore', 'LICENSE'
];

export const LANGUAGE_SCORES: Record<string, number> = {
  JAVASCRIPT: 5,
  TYPESCRIPT: 5,
  PYTHON: 5,
  JAVA: 5,
  'C#': 5,
  PHP: 4,
  GO: 4,
  RUBY: 4,
  SWIFT: 4,
  KOTLIN: 4,
  RUST: 4,
  SCALA: 3,
  DART: 3,
  HTML: 2,
  CSS: 2,
  SHELL: 2,
  DOCKERFILE: 2,
  YAML: 2,
  HCL: 2,
};
