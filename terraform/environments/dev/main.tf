# ==============================================================================
# 1. Network Layer (VPC, Multi-AZ Subnets, NAT Gateway)
# ==============================================================================
module "vpc" {
  source                = "../../modules/vpc"
  environment           = var.environment
  enable_nat_gateway    = true
  vpc_cidr              = "10.0.0.0/16"
  public_subnet_a_cidr  = "10.0.1.0/24"
  public_subnet_b_cidr  = "10.0.2.0/24"
  private_subnet_a_cidr = "10.0.10.0/24"
  private_subnet_b_cidr = "10.0.20.0/24"
}

# ==============================================================================
# 2. Storage Layer (S3 Media Storage)
# ==============================================================================
module "s3" {
  source      = "../../modules/s3-secure-bucket"
  environment = var.environment
  bucket_name = "${var.project_name}-media-${var.environment}"
}

# ==============================================================================
# 3. Database Layer (AWS RDS PostgreSQL via Reusable Module)
# ==============================================================================
module "rds" {
  source             = "../../modules/rds"
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_name            = "mydb"
  db_username        = "myuser"
  db_password        = var.db_password
}

# ==============================================================================
# 4. Enterprise Kubernetes Cluster (AWS EKS via Reusable Module)
# ==============================================================================
module "eks" {
  source       = "../../modules/eks"
  project_name = var.project_name
  environment  = var.environment
  subnet_ids   = concat(module.vpc.public_subnet_ids, module.vpc.private_subnet_ids)
}

# ==============================================================================
# 5. Application Load Balancer (Public Ingress Front Door via Reusable Module)
# ==============================================================================
module "alb" {
  source            = "../../modules/alb"
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  target_type       = "ip"
  app_port          = var.ingress_node_port
  target_id         = var.ingress_node_ip
}