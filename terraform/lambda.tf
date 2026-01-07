# Lambda function for GraphQL server
resource "aws_lambda_function" "graphql" {
  filename      = "${path.module}/../lambda-function.zip"
  function_name = "${var.app_name}-function"
  role          = aws_iam_role.lambda_role.arn
  handler       = "lambda-handler.handler"
  runtime       = "nodejs20.x"
  memory_size   = var.lambda_memory
  timeout       = var.lambda_timeout

  source_code_hash = fileexists("${path.module}/../lambda-function.zip") ? filebase64sha256("${path.module}/../lambda-function.zip") : null

  environment {
    variables = {
      DEPLOYMENT_ENV = "aws-lambda"
      NODE_ENV       = "production"
    }
  }

  tags = {
    Name        = "${var.app_name}-function"
    Environment = var.environment
  }

  # Ensure Lambda waits for IAM role to be ready
  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic
  ]
}

# Lambda permission for API Gateway to invoke the function
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.graphql.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.graphql.execution_arn}/*/*"
}
