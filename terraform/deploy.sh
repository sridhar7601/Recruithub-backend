#!/bin/bash
# deploy.sh - Automated deployment script for RecruitHub

set -e  # Exit immediately if a command exits with a non-zero status

echo "===== RecruitHub Deployment Script ====="
echo "Starting deployment process..."

# Step 1: Initialize, plan, and apply Terraform to create/update infrastructure
echo "Initializing Terraform..."
cd environments/prod
terraform init

echo "Planning Terraform changes..."
terraform plan

echo "Applying Terraform configuration..."
terraform apply -auto-approve

# Step 2: Extract outputs from Terraform
echo "Extracting Terraform outputs..."
ECR_REPO=$(terraform output -raw ecr_repository_url)
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name)
ECS_SERVICE=$(terraform output -raw ecs_service_name)
REGION=$(terraform output -raw region)
DOCDB_ENDPOINT=$(terraform output -raw docdb_endpoint)
QUEUE_URL=$(terraform output -raw profile_evaluator_queue_url)

echo "ECR Repository: $ECR_REPO"
echo "ECS Cluster: $ECS_CLUSTER"
echo "ECS Service: $ECS_SERVICE"
echo "Region: $REGION"
echo "DocumentDB Endpoint: $DOCDB_ENDPOINT"
echo "SQS Queue URL: $QUEUE_URL"

# Step 3: Verify task definition has the correct environment variables
echo "Verifying task definition environment variables..."
TASK_DEF_ARN=$(aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $REGION --query 'services[0].taskDefinition' --output text)
echo "Current task definition: $TASK_DEF_ARN"
echo "Environment variables are automatically set in the task definition with values from Terraform outputs"

# Step 4: Build Docker image
echo "Building Docker image..."

cd ../../../

docker build --platform linux/amd64 -t $ECR_REPO:latest .

# Step 5: Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO

# Step 6: Push image to ECR
echo "Pushing image to ECR..."
docker push $ECR_REPO:latest

# Step 7: Update ECS service
echo "Updating ECS service..."
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $REGION

echo "===== Deployment Complete ====="
echo "Your application should be deployed and running shortly."
echo "You can access it at: https://api.recruithub.app.presidio.com/api"
