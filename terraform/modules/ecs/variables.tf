variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ID of the ALB security group"
  type        = string
}

variable "target_group_arn" {
  description = "ARN of the target group"
  type        = string
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
}

variable "task_cpu" {
  description = "CPU units for the ECS task"
  type        = number
}

variable "task_memory" {
  description = "Memory for the ECS task"
  type        = number
}

variable "service_desired_count" {
  description = "Desired count of services"
  type        = number
}

variable "profile_evaluator_queue_url" {
  description = "URL of the profile evaluator SQS queue"
  type        = string
}

variable "profile_evaluator_queue_arn" {
  description = "ARN of the profile evaluator SQS queue"
  type        = string
}

variable "profile_evaluator_dlq_arn" {
  description = "ARN of the profile evaluator dead-letter queue"
  type        = string
}

variable "docdb_endpoint" {
  description = "Endpoint of the DocumentDB cluster"
  type        = string
}

variable "db_username" {
  description = "Username for DocumentDB"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for DocumentDB"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the database"
  type        = string
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
}

variable "wecp_api_key" {
  description = "WeCP API key for authentication"
  type        = string
  sensitive   = true
}

variable "wecp_api_url" {
  description = "WeCP API URL"
  type        = string
}

variable "default_log_level" {
  description = "Default logging level (error, warn, log, debug, trace)"
  type        = string
}
