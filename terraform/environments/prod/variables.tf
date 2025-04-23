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

variable "api_key" {
  description = "API key for bearer token authentication"
  type        = string
  sensitive   = true
  default     = "cde7ac9e2f9b7950690b0b44c031309591de0ae033976d762c1b220c02b4614b"
}

variable "github_access_tokens" {
  description = "GitHub access tokens for API authentication"
  type        = string
  sensitive   = true
}

variable "wecp_api_key" {
  description = "WeCP API key for authentication"
  type        = string
  sensitive   = true
}

variable "github_parallel_limit" {
  description = "Number of GitHub profiles to evaluate in parallel"
  type        = number
  default     = 5
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
