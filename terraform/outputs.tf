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
