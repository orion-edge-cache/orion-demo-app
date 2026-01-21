# HTTP API Gateway (simpler and cheaper than REST API)
resource "aws_apigatewayv2_api" "graphql" {
  name          = "${var.app_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["http://localhost:5173"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }

  tags = {
    Name        = "${var.app_name}-api"
    Environment = var.environment
  }
}

# Default stage (auto-deployed)
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.graphql.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Name        = "${var.app_name}-api-stage"
    Environment = var.environment
  }
}

# Lambda integration
resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.graphql.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.graphql.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Default route (catch all requests)
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.graphql.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}
