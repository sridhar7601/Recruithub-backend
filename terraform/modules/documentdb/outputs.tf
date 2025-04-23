output "docdb_endpoint" {
  description = "Endpoint of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.endpoint
}

output "docdb_reader_endpoint" {
  description = "Reader endpoint of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.reader_endpoint
}

output "docdb_port" {
  description = "Port of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.port
}

output "docdb_security_group_id" {
  description = "ID of the DocumentDB security group"
  value       = aws_security_group.docdb.id
}

output "docdb_cluster_resource_id" {
  description = "Resource ID of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.cluster_resource_id
}
