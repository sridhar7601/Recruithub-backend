# Output values from the root module

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.recruithub.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.recruithub.alb_dns_name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = module.recruithub.ecr_repository_url
}

output "docdb_endpoint" {
  description = "Endpoint of the DocumentDB cluster"
  value       = module.recruithub.docdb_endpoint
}

output "profile_evaluator_queue_url" {
  description = "URL of the profile evaluator SQS queue"
  value       = module.recruithub.profile_evaluator_queue_url
}

output "api_url" {
  description = "URL of the API"
  value       = module.recruithub.api_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = "recruithub-cluster-prod"
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = "recruithub-service-prod"
}

output "region" {
  description = "AWS region"
  value       = "us-west-2"
}
