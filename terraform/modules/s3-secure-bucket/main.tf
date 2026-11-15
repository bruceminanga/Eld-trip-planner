# ==============================================================================
# 1. The Storage Vault (The S3 Bucket Body)
# ==============================================================================
resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  tags   = { Environment = var.environment }
}

# ==============================================================================
# 2. Modern Ownership Controls (Disable Legacy ACLs)
# ==============================================================================
# Ensures the bucket owner automatically owns all objects uploaded to this bucket,
# removing risks from messy, deprecated access-control-list permissions.
resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# ==============================================================================
# 3. Public Access Block (The 4-Point Deadbolt)
# ==============================================================================
# Guarantees that no developer or bad policy can accidentally expose 
# sensitive patient or application files to the public internet.
resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==============================================================================
# 4. Server-Side Encryption (Encryption at Rest)
# ==============================================================================
# Automatically encrypts every single file with AES-256 before writing it to disk.
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ==============================================================================
# 5. CORS Configuration (Cross-Origin Resource Sharing)
# ==============================================================================
# Allows the React/frontend browser client to interact directly with S3
# for file uploads, avatars, or document viewing without hitting CORS errors.
resource "aws_s3_bucket_cors_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ==============================================================================
# 6. Lifecycle Hygiene (Cost Optimization & Auto-Cleanup)
# ==============================================================================
# Aborts and purges abandoned multipart uploads after 7 days to prevent hidden AWS charges.
resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "abort-incomplete-multipart-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}