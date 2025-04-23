# Dead Letter Queue for failed messages
resource "aws_sqs_queue" "profile_evaluator_dlq" {
  name                      = "${var.project_name}-profile-evaluator-dlq-${var.environment}"
  message_retention_seconds = 1209600  # 14 days
  
  # Enable server-side encryption
  sqs_managed_sse_enabled = true
  
  tags = {
    Name = "${var.project_name}-profile-evaluator-dlq-${var.environment}"
  }
}

# Main Profile Evaluator Queue
resource "aws_sqs_queue" "profile_evaluator" {
  name                      = "${var.project_name}-profile-evaluator-${var.environment}"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 345600  # 4 days
  receive_wait_time_seconds = 0
  visibility_timeout_seconds = 300    # 5 minutes
  
  # Enable server-side encryption
  sqs_managed_sse_enabled = true
  
  # Configure dead-letter queue
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.profile_evaluator_dlq.arn
    maxReceiveCount     = 5
  })
  
  tags = {
    Name = "${var.project_name}-profile-evaluator-${var.environment}"
  }
}

# IAM policy for SQS access
resource "aws_iam_policy" "sqs_access" {
  name        = "${var.project_name}-sqs-access-${var.environment}"
  description = "Policy for accessing SQS queues"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ChangeMessageVisibility"
        ]
        Effect   = "Allow"
        Resource = [aws_sqs_queue.profile_evaluator.arn]
      },
      {
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Effect   = "Allow"
        Resource = [aws_sqs_queue.profile_evaluator_dlq.arn]
      }
    ]
  })
}
