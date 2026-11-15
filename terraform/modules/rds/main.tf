# ==============================================================================
# 1. DB Subnet Group (Isolates RDS into Private Subnets)
# ==============================================================================
resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

# ==============================================================================
# 2. Database Firewall (Allows PostgreSQL 5432 Only from VPC)
# ==============================================================================
resource "aws_security_group" "this" {
  name_prefix = "${var.project_name}-${var.environment}-db-sg-"
  description = "Allow inbound PostgreSQL traffic from VPC"
  vpc_id      = var.vpc_id

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-db-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "postgres" {
  for_each          = toset(var.allowed_cidr_blocks)
  security_group_id = aws_security_group.this.id
  description       = "Allow PostgreSQL from VPC"
  cidr_ipv4         = each.value
  from_port         = 5432
  ip_protocol       = "tcp"
  to_port           = 5432
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.this.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ==============================================================================
# 3. Managed PostgreSQL Instance
# ==============================================================================
resource "aws_db_instance" "this" {
  identifier             = "${var.project_name}-${var.environment}-postgres"
  engine                 = "postgres"
  engine_version         = var.engine_version
  instance_class         = var.instance_class
  allocated_storage      = var.allocated_storage
  storage_encrypted      = true
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]
  skip_final_snapshot    = var.skip_final_snapshot
  deletion_protection    = var.deletion_protection

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-postgres"
  }
}