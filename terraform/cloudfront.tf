# CloudFront distribution for S3-hosted React frontend

# Origin Access Control for secure S3 access
resource "aws_cloudfront_origin_access_control" "client" {
  name                              = "${var.app_name}-client-oac"
  description                       = "OAC for ${var.app_name} client S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "client" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "${var.app_name} React client"

  origin {
    domain_name              = aws_s3_bucket.client.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.client.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.client.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.client.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # Short TTLs for demo app (5 minutes default)
    min_ttl     = 0
    default_ttl = 300
    max_ttl     = 3600
  }

  # SPA routing: serve index.html for 403 (access denied) errors
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  # SPA routing: serve index.html for 404 (not found) errors
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.app_name}-cloudfront"
    Environment = var.environment
  }
}
