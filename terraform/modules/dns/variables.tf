variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the load balancer"
  type        = string
}

variable "alb_zone_id" {
  description = "Zone ID of the load balancer"
  type        = string
}
