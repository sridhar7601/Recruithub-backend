output "profile_evaluator_queue_url" {
  description = "URL of the profile evaluator SQS queue"
  value       = aws_sqs_queue.profile_evaluator.url
}

output "profile_evaluator_queue_arn" {
  description = "ARN of the profile evaluator SQS queue"
  value       = aws_sqs_queue.profile_evaluator.arn
}

output "profile_evaluator_dlq_url" {
  description = "URL of the profile evaluator dead-letter queue"
  value       = aws_sqs_queue.profile_evaluator_dlq.url
}

output "profile_evaluator_dlq_arn" {
  description = "ARN of the profile evaluator dead-letter queue"
  value       = aws_sqs_queue.profile_evaluator_dlq.arn
}

output "sqs_policy_arn" {
  description = "ARN of the SQS access policy"
  value       = aws_iam_policy.sqs_access.arn
}
