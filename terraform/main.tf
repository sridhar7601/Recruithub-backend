module "networking" {
  source = "./modules/networking"
  
  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

module "sqs" {
  source = "./modules/sqs"
  
  project_name = var.project_name
  environment  = var.environment
}

module "documentdb" {
  source = "./modules/documentdb"
  
  project_name         = var.project_name
  environment          = var.environment
  vpc_id               = module.networking.vpc_id
  subnet_ids           = module.networking.private_subnet_ids
  app_security_group_id = module.ecs.ecs_security_group_id
  db_username          = var.db_username
  db_password          = var.db_password
  db_name              = var.db_name
  min_capacity         = var.db_min_capacity
  max_capacity         = var.db_max_capacity
}

module "dns" {
  source = "./modules/dns"
  
  project_name   = var.project_name
  environment    = var.environment
  domain_name    = var.domain_name
  alb_dns_name   = module.load_balancer.alb_dns_name
  alb_zone_id    = module.load_balancer.alb_zone_id
}

module "load_balancer" {
  source = "./modules/load_balancer"
  
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  container_port    = var.container_port
  health_check_path = var.health_check_path
  certificate_arn   = module.dns.certificate_arn
}

module "ecs" {
  source = "./modules/ecs"
  
  project_name          = var.project_name
  environment           = var.environment
  region                = var.region
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.load_balancer.alb_security_group_id
  target_group_arn      = module.load_balancer.target_group_arn
  container_port        = var.container_port
  task_cpu              = var.task_cpu
  task_memory           = var.task_memory
  service_desired_count = var.service_desired_count
  profile_evaluator_queue_url = module.sqs.profile_evaluator_queue_url
  profile_evaluator_queue_arn = module.sqs.profile_evaluator_queue_arn
  profile_evaluator_dlq_arn   = module.sqs.profile_evaluator_dlq_arn
  docdb_endpoint        = module.documentdb.docdb_endpoint
  db_username           = var.db_username
  db_password           = var.db_password
  db_name               = var.db_name
  api_key               = var.api_key
  github_access_tokens  = var.github_access_tokens
  github_parallel_limit = var.github_parallel_limit
  wecp_api_key         = var.wecp_api_key
  wecp_api_url         = var.wecp_api_url
  default_log_level    = var.default_log_level
}
