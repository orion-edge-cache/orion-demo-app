# S3 bucket for storing database (db.json)
resource "aws_s3_bucket" "data" {
  bucket = "${var.app_name}-data-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.app_name}-data"
    Environment = var.environment
  }
}

# Enable versioning for data bucket (for recovery)
resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id

  versioning_configuration {
    status = "Enabled"
  }
}

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

# Allow public access to client bucket (for static website)
resource "aws_s3_bucket_public_access_block" "client" {
  bucket = aws_s3_bucket.client.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy to allow public read access to client files
resource "aws_s3_bucket_policy" "client" {
  bucket = aws_s3_bucket.client.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.client.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.client]
}
