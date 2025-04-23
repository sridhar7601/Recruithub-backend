# Dev environment configuration

# Reference to the root module
module "recruithub" {
  source = "../../"
  
  # Environment-specific variables
  environment           = "prod"
  region                = "us-west-2"
  vpc_cidr              = "10.0.0.0/16"
  availability_zones    = ["us-west-2a", "us-west-2b"]
  domain_name           = "api.recruithub.app.presidio.com"
  db_username           = var.db_username
  db_password           = var.db_password
  db_name               = "recruithub"
  db_min_capacity       = 0.5
  db_max_capacity       = 4
  container_port        = 8000
  health_check_path     = "/api/health"
  task_cpu              = 1024
  task_memory           = 3072
  service_desired_count = 1
  api_key               = var.api_key
  github_access_tokens  = var.github_access_tokens
  github_parallel_limit = 5
  wecp_api_key         = var.wecp_api_key
  wecp_api_url         = "https://api.wecreateproblems.com/ats/wecp/tests"
  default_log_level    = "debug"
}
