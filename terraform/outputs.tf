# API Gateway endpoint URL
output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.graphql.api_endpoint
}

# GraphQL endpoint URL
output "graphql_endpoint" {
  description = "GraphQL endpoint URL"
  value       = "${aws_apigatewayv2_api.graphql.api_endpoint}/graphql"
}

# S3 static website endpoint
output "s3_website_endpoint" {
  description = "S3 static website endpoint"
  value       = aws_s3_bucket_website_configuration.client.website_endpoint
}

# S3 static website full URL
output "s3_website_url" {
  description = "S3 static website URL"
  value       = "http://${aws_s3_bucket.client.bucket}.s3-website-${var.aws_region}.amazonaws.com"
}

# Client bucket name
output "client_bucket" {
  description = "S3 bucket name for client files"
  value       = aws_s3_bucket.client.id
}

# Lambda function name
output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.graphql.function_name
}

# Lambda function ARN
output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.graphql.arn
}

# AWS Region
output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

# CloudFront distribution domain
output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.client.domain_name
}

# CloudFront distribution URL
output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.client.domain_name}"
}

# CloudFront distribution ID
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.client.id
}
