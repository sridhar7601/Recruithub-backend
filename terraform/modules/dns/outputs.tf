output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.main.arn
}

output "domain_name" {
  description = "Domain name for the application"
  value       = var.domain_name
}

output "hosted_zone_id" {
  description = "ID of the Route53 hosted zone"
  value       = data.aws_route53_zone.existing.zone_id
}

output "api_fqdn" {
  description = "Fully qualified domain name for the API"
  value       = aws_route53_record.api.fqdn
}
