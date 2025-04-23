provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "RecruitHub"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
