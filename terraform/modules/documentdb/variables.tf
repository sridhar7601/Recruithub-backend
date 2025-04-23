variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "IDs of the subnets where DocumentDB will be deployed"
  type        = list(string)
}

variable "app_security_group_id" {
  description = "ID of the security group for the application"
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

variable "min_capacity" {
  description = "Minimum capacity units for DocumentDB serverless"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Maximum capacity units for DocumentDB serverless"
  type        = number
  default     = 16
}
