# ==============================================================================
# 1. The Compute 
# ==============================================================================
resource "aws_instance" "this" {
  ami                  = var.instance_ami
  instance_type        = var.instance_type
  subnet_id            = var.subnet_id
  iam_instance_profile = aws_iam_instance_profile.this.name

  vpc_security_group_ids = [aws_security_group.this.id]

  user_data_replace_on_change = true

  user_data = var.user_data != null ? var.user_data : <<-EOF
              #!/bin/bash
              set -e
              apt-get update -y
              apt-get install -y docker.io
              systemctl enable --now docker
              docker run -d --restart always -p 80:80 your-dockerhub-user/my-react-app:latest
              docker run -d --restart always -p 8000:8000 your-dockerhub-user/my-django-app:latest
              EOF

  tags = {
    Name = "${var.environment}-fullstack-server"
  }
}

# ==============================================================================
# 2. Security Group Firewall (Device-Level Smart Lock)
# ==============================================================================
resource "aws_security_group" "this" {
  name_prefix = "app-firewall-${var.environment}-"
  description = "Firewall for Web Application"
  vpc_id      = var.vpc_id

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.environment}-app-firewall"
  }
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.this.id
  description       = "Allow HTTP"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.this.id
  description       = "Allow HTTPS"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.this.id
  description       = "Allow outbound"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ==============================================================================
# 3. IAM Role & S3 Permissions (Access Keys / Identity)
# ==============================================================================
resource "aws_iam_role" "this" {
  name = "django-server-${var.environment}-s3-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "this" {
  name = "django-s3-${var.environment}-policy"
  role = aws_iam_role.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        var.s3_bucket_arn,
        "${var.s3_bucket_arn}/*"
      ]
    }]
  })
}

resource "aws_iam_instance_profile" "this" {
  name = "django-server-${var.environment}-profile"
  role = aws_iam_role.this.name
}