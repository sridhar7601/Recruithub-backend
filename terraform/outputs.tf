output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.load_balancer.alb_dns_name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = module.ecs.ecr_repository_url
}

output "docdb_endpoint" {
  description = "Endpoint of the DocumentDB cluster"
  value       = module.documentdb.docdb_endpoint
}

output "profile_evaluator_queue_url" {
  description = "URL of the profile evaluator SQS queue"
  value       = module.sqs.profile_evaluator_queue_url
}

output "api_url" {
  description = "URL of the API"
  value       = "https://${var.domain_name}"
}
