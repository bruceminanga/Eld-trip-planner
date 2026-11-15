locals {
  environment = "prod"
}

# 1. Network Layer
module "vpc" {
  source                = "../../modules/vpc"
  environment           = "prod"
  enable_nat_gateway    = false
  vpc_cidr              = "10.0.0.0/16"
  public_subnet_a_cidr  = "10.0.1.0/24"  # ✅ 
  public_subnet_b_cidr  = "10.0.2.0/24"  # ✅ 
  private_subnet_a_cidr = "10.0.10.0/24" # ✅ 
  private_subnet_b_cidr = "10.0.20.0/24" # ✅ 
}

# 2. Storage Layer
module "s3" {
  source      = "../../modules/s3-secure-bucket"
  environment = "prod"
  bucket_name = "my-app-media-storage-${local.environment}"
}

# 3. Compute Layer
module "ec2" {
  source        = "../../modules/ec2-app-server"
  environment   = "prod"
  vpc_id        = module.vpc.vpc_id
  subnet_id     = module.vpc.public_subnet_a_id
  s3_bucket_arn = module.s3.bucket_arn

  instance_type = "t3.micro"
}

# 4. The Load Balancer (The Reception Desk)
variable "enable_alb" {
  type    = bool
  default = false # Keep false for free LocalStack, set to true for real AWS!
}

module "alb" {
  count              = var.enable_alb ? 1 : 0
  source             = "../../modules/alb"
  environment        = "prod"
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  target_instance_id = module.ec2.instance_id
  app_port           = 80
}