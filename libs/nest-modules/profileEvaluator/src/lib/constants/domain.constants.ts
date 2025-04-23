/**
 * Technology categories for better organization
 */
export enum TechnologyCategory {
  LANGUAGE = 'LANGUAGE',
  FRAMEWORK = 'FRAMEWORK',
  DATABASE = 'DATABASE',
  CLOUD = 'CLOUD',
  TOOL = 'TOOL'
}

/**
 * Domain mapping for technologies
 */
export enum Domain {
  FULL_STACK = 'FULL STACK',
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  MOBILE_DEVELOPMENT = 'MOBILE DEVELOPMENT',
  DEVOPS = 'DEVOPS',
  DATA = 'DATA',
  OTHERS = 'OTHERS'
}

/**
 * Framework detection arrays for better categorization
 */
export const JS_FRAMEWORKS = [
  'REACT',
  'ANGULAR',
  'VUE',
  'SVELTE',
  'NEXTJS',
  'NUXTJS',
  'NODE',
  'NESTJS',
  'EXPRESS'
];

export const PYTHON_FRAMEWORKS = [
  'FLASK',
  'DJANGO',
  'FASTAPI',
  'PANDAS',
  'NUMPY',
  'SCIPY',
  'SCIKIT',
  'TENSORFLOW',
  'PYTORCH'
];

export const JAVA_FRAMEWORKS = [
  'SPRINGBOOT',
  'HIBERNATE',
  'JUNIT',
  'GRADLE',
  'MAVEN'
];

export const DATABASE_TECHNOLOGIES = [
  'POSTGRESQL',
  'MONGODB',
  'MYSQL',
  'REDIS',
  'ELASTICSEARCH',
  'SNOWFLAKE'
];

export const CLOUD_TECHNOLOGIES = [
  'AWS',
  'AZURE',
  'GCP',
  'HEROKU',
  'DIGITALOCEAN'
];

/**
 * Technology categorization
 */
export const TECHNOLOGY_CATEGORIES: Record<string, TechnologyCategory> = {
  // Languages
  JAVASCRIPT: TechnologyCategory.LANGUAGE,
  TYPESCRIPT: TechnologyCategory.LANGUAGE,
  PYTHON: TechnologyCategory.LANGUAGE,
  JAVA: TechnologyCategory.LANGUAGE,
  'C#': TechnologyCategory.LANGUAGE,
  PHP: TechnologyCategory.LANGUAGE,
  RUBY: TechnologyCategory.LANGUAGE,
  GO: TechnologyCategory.LANGUAGE,
  RUST: TechnologyCategory.LANGUAGE,
  SWIFT: TechnologyCategory.LANGUAGE,
  KOTLIN: TechnologyCategory.LANGUAGE,
  DART: TechnologyCategory.LANGUAGE,
  R: TechnologyCategory.LANGUAGE,

  // Frameworks
  REACT: TechnologyCategory.FRAMEWORK,
  ANGULAR: TechnologyCategory.FRAMEWORK,
  VUE: TechnologyCategory.FRAMEWORK,
  SVELTE: TechnologyCategory.FRAMEWORK,
  NEXTJS: TechnologyCategory.FRAMEWORK,
  NUXTJS: TechnologyCategory.FRAMEWORK,
  NESTJS: TechnologyCategory.FRAMEWORK,
  EXPRESS: TechnologyCategory.FRAMEWORK,
  DJANGO: TechnologyCategory.FRAMEWORK,
  FLASK: TechnologyCategory.FRAMEWORK,
  SPRINGBOOT: TechnologyCategory.FRAMEWORK,
  'REACT-NATIVE': TechnologyCategory.FRAMEWORK,
  FLUTTER: TechnologyCategory.FRAMEWORK,

  // Databases
  POSTGRESQL: TechnologyCategory.DATABASE,
  MONGODB: TechnologyCategory.DATABASE,
  MYSQL: TechnologyCategory.DATABASE,
  REDIS: TechnologyCategory.DATABASE,
  ELASTICSEARCH: TechnologyCategory.DATABASE,
  SNOWFLAKE: TechnologyCategory.DATABASE,

  // Cloud
  AWS: TechnologyCategory.CLOUD,
  AZURE: TechnologyCategory.CLOUD,
  GCP: TechnologyCategory.CLOUD,
  HEROKU: TechnologyCategory.CLOUD,
  DIGITALOCEAN: TechnologyCategory.CLOUD,

  // Tools
  DOCKER: TechnologyCategory.TOOL,
  KUBERNETES: TechnologyCategory.TOOL,
  JENKINS: TechnologyCategory.TOOL,
  TERRAFORM: TechnologyCategory.TOOL,
  ANSIBLE: TechnologyCategory.TOOL,
  GRAFANA: TechnologyCategory.TOOL,
  PROMETHEUS: TechnologyCategory.TOOL
};

/**
 * Mapping of technologies to domains
 */
export const LANGUAGE_DOMAIN_MAPPING: Record<string, Domain> = {
  // Full Stack Frameworks
  SPRINGBOOT: Domain.FULL_STACK,
  FLASK: Domain.FULL_STACK,
  DJANGO: Domain.FULL_STACK,
  NESTJS: Domain.FULL_STACK,
  LARAVEL: Domain.FULL_STACK,
  RAILS: Domain.FULL_STACK,

  // Frontend Technologies
  ANGULAR: Domain.FRONTEND,
  REACT: Domain.FRONTEND,
  VUE: Domain.FRONTEND,
  SVELTE: Domain.FRONTEND,
  NEXTJS: Domain.FRONTEND,
  NUXTJS: Domain.FRONTEND,
  HTML: Domain.FRONTEND,
  CSS: Domain.FRONTEND,
  SASS: Domain.FRONTEND,
  LESS: Domain.FRONTEND,
  TYPESCRIPT: Domain.FRONTEND,
  JAVASCRIPT: Domain.FRONTEND,
  WEBPACK: Domain.FRONTEND,
  BABEL: Domain.FRONTEND,
  JQUERY: Domain.FRONTEND,

  // Backend Technologies
  JAVA: Domain.BACKEND,
  PYTHON: Domain.BACKEND,
  'C#': Domain.BACKEND,
  RUBY: Domain.BACKEND,
  GO: Domain.BACKEND,
  SCALA: Domain.BACKEND,
  RUST: Domain.BACKEND,
  PHP: Domain.BACKEND,
  EXPRESS: Domain.BACKEND,
  NODE: Domain.BACKEND,
  FASTAPI: Domain.BACKEND,
  GRAPHQL: Domain.BACKEND,
  POSTGRESQL: Domain.BACKEND,
  MONGODB: Domain.BACKEND,
  MYSQL: Domain.BACKEND,
  REDIS: Domain.BACKEND,
  ELASTICSEARCH: Domain.BACKEND,
  RABBITMQ: Domain.BACKEND,
  KAFKA: Domain.BACKEND,

  // Mobile Development
  'REACT-NATIVE': Domain.MOBILE_DEVELOPMENT,
  FLUTTER: Domain.MOBILE_DEVELOPMENT,
  SWIFT: Domain.MOBILE_DEVELOPMENT,
  DART: Domain.MOBILE_DEVELOPMENT,
  KOTLIN: Domain.MOBILE_DEVELOPMENT,
  XAMARIN: Domain.MOBILE_DEVELOPMENT,
  IONIC: Domain.MOBILE_DEVELOPMENT,
  ANDROIDSTUDIO: Domain.MOBILE_DEVELOPMENT,
  XCODE: Domain.MOBILE_DEVELOPMENT,

  // DevOps
  DOCKER: Domain.DEVOPS,
  KUBERNETES: Domain.DEVOPS,
  JENKINS: Domain.DEVOPS,
  TERRAFORM: Domain.DEVOPS,
  ANSIBLE: Domain.DEVOPS,
  AWS: Domain.DEVOPS,
  AZURE: Domain.DEVOPS,
  GCP: Domain.DEVOPS,
  NGINX: Domain.DEVOPS,
  YAML: Domain.DEVOPS,
  SHELL: Domain.DEVOPS,
  BASH: Domain.DEVOPS,
  HCL: Domain.DEVOPS,
  DOCKERFILE: Domain.DEVOPS,
  PROMETHEUS: Domain.DEVOPS,
  GRAFANA: Domain.DEVOPS,

  // Data
  'JUPYTER NOTEBOOK': Domain.DATA,
  PANDAS: Domain.DATA,
  NUMPY: Domain.DATA,
  SCIPY: Domain.DATA,
  SCIKIT: Domain.DATA,
  TENSORFLOW: Domain.DATA,
  PYTORCH: Domain.DATA,
  R: Domain.DATA,
  TABLEAU: Domain.DATA,
  POWERBI: Domain.DATA,
  HADOOP: Domain.DATA,
  SPARK: Domain.DATA,
  AIRFLOW: Domain.DATA,
  SNOWFLAKE: Domain.DATA,
  DATABRICKS: Domain.DATA
};
