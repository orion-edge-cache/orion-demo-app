# S3 bucket for React client (static website hosting)
resource "aws_s3_bucket" "client" {
  bucket = "${var.app_name}-client-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.app_name}-client"
    Environment = var.environment
  }
}

# Configure static website hosting for client bucket
resource "aws_s3_bucket_website_configuration" "client" {
  bucket = aws_s3_bucket.client.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # SPA routing - all routes go to index.html
  }
}

# Block all public access to client bucket (CloudFront will access via OAC)
resource "aws_s3_bucket_public_access_block" "client" {
  bucket = aws_s3_bucket.client.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy to allow CloudFront OAC access to client files
resource "aws_s3_bucket_policy" "client" {
  bucket = aws_s3_bucket.client.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.client.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.client.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.client]
}
