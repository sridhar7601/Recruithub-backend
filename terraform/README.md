# RecruitHub Infrastructure

This repository contains the Terraform configuration for deploying the RecruitHub application infrastructure on AWS.

## Architecture

The infrastructure consists of the following components:

- VPC with public and private subnets
- ECS Fargate for running the NestJS application
- DocumentDB for MongoDB compatibility
- SQS for profile evaluation processing
- Application Load Balancer for routing traffic
- Route53 for DNS management
- ACM for SSL certificates

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) (v1.0.0+)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [Docker](https://www.docker.com/get-started) for building and pushing container images

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Configure environment variables

Copy the example terraform.tfvars file and fill in the values:

```bash
cd terraform/environments/prod
cp terraform.tfvars.example terraform.tfvars
```

Edit the `terraform.tfvars` file to set the required variables:

```hcl
db_username = "admin"
db_password = "your-secure-password"
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan the deployment

```bash
terraform plan
```

### 5. Apply the configuration

```bash
terraform apply
```

### 6. Build and push the Docker image

After the infrastructure is deployed, you need to build and push the Docker image to the ECR repository:

```bash
# Get the ECR repository URL
ECR_REPO=$(terraform output -raw ecr_repository_url)

# Login to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $ECR_REPO

# Build and push the image
docker build -t $ECR_REPO:latest ../../
docker push $ECR_REPO:latest
```

### 7. Update the ECS service

```bash
aws ecs update-service --cluster recruithub-cluster-prod --service recruithub-service-prod --force-new-deployment
```

## Environment-Specific Configurations

The infrastructure is organized to support multiple environments:

- `dev`: Development environment
- `prod`: Production environment (not configured yet)

To deploy to a different environment, navigate to the appropriate directory and follow the same steps.

## Modules

The infrastructure is organized into the following modules:

- `networking`: VPC, subnets, internet gateway, NAT gateway, route tables
- `documentdb`: DocumentDB cluster and instance
- `sqs`: SQS queues for profile evaluation
- `ecs`: ECS cluster, task definition, service, and ECR repository
- `load_balancer`: Application Load Balancer, target group, and listeners
- `dns`: Route53 records and ACM certificate

## Outputs

After applying the configuration, you can view the outputs:

```bash
terraform output
```

Key outputs include:

- `api_url`: The URL of the API
- `ecr_repository_url`: The URL of the ECR repository
- `docdb_endpoint`: The endpoint of the DocumentDB cluster
- `profile_evaluator_queue_url`: The URL of the profile evaluator SQS queue
