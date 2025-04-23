resource "aws_docdb_subnet_group" "main" {
  name       = "${var.project_name}-docdb-subnet-group-${var.environment}"
  subnet_ids = var.subnet_ids
  
  tags = {
    Name = "${var.project_name}-docdb-subnet-group-${var.environment}"
  }
}

resource "aws_security_group" "docdb" {
  name        = "${var.project_name}-docdb-sg-${var.environment}"
  description = "Security group for DocumentDB"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-docdb-sg-${var.environment}"
  }
}

resource "aws_docdb_cluster_parameter_group" "main" {
  family      = "docdb5.0"
  name        = "${var.project_name}-docdb-params-${var.environment}"
  description = "Parameter group for DocumentDB cluster"
  
  parameter {
    name  = "tls"
    value = "disabled"
  }
  
  tags = {
    Name = "${var.project_name}-docdb-params-${var.environment}"
  }
}

resource "aws_docdb_cluster" "main" {
  cluster_identifier      = "${var.project_name}-docdb-${var.environment}"
  engine                  = "docdb"
  engine_version          = "5.0.0"
  master_username         = var.db_username
  master_password         = var.db_password
  db_subnet_group_name    = aws_docdb_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.docdb.id]
  skip_final_snapshot     = true
  deletion_protection     = var.environment == "prod" ? true : false
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name
  
  # Using standard cluster instead of serverless for compatibility
  # We can enable serverless later if needed
  
  tags = {
    Name = "${var.project_name}-docdb-${var.environment}"
  }
}

# Create a DocumentDB instance in the cluster
resource "aws_docdb_cluster_instance" "main" {
  count              = 1
  identifier         = "${var.project_name}-docdb-instance-${count.index}-${var.environment}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.environment == "prod" ? "db.r5.large" : "db.t3.medium"
  
  tags = {
    Name = "${var.project_name}-docdb-instance-${count.index}-${var.environment}"
  }
}
