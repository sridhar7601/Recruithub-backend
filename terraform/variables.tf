variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "recruithub"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "api.recruithub.app.presidio.com"
}

variable "db_username" {
  description = "DocumentDB username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "DocumentDB password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "DocumentDB database name"
  type        = string
  default     = "recruithub"
}

variable "db_min_capacity" {
  description = "DocumentDB minimum capacity units"
  type        = number
  default     = 0.5
}

variable "db_max_capacity" {
  description = "DocumentDB maximum capacity units"
  type        = number
  default     = 16
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 8000
}

variable "health_check_path" {
  description = "Health check path for the application"
  type        = string
  default     = "/api/health"
}

variable "task_cpu" {
  description = "CPU units for the ECS task"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Memory for the ECS task"
  type        = number
  default     = 512
}

variable "service_desired_count" {
  description = "Desired count of services"
  type        = number
  default     = 2
}

variable "api_key" {
  description = "API key for bearer token authentication"
  type        = string
  sensitive   = true
}

variable "github_access_tokens" {
  description = "GitHub access tokens for API authentication"
  type        = string
  sensitive   = true
}

variable "github_parallel_limit" {
  description = "Number of GitHub profiles to evaluate in parallel"
  type        = number
  default     = 5
}

variable "wecp_api_key" {
  description = "WeCP API key for authentication"
  type        = string
  sensitive   = true
}

variable "wecp_api_url" {
  description = "WeCP API URL"
  type        = string
  default     = "https://api.wecreateproblems.com/ats/wecp/tests"
}

variable "default_log_level" {
  description = "Default logging level (error, warn, log, debug, trace)"
  type        = string
  default     = "debug"
}
