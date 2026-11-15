variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

variable "aws_region" {
  type        = string
  description = "AWS region (e.g. us-east-1)"
  default     = "us-east-1"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "public_subnet_a_cidr" {
  type        = string
  description = "CIDR for Public Subnet A"
  default     = "10.0.1.0/24"
}

variable "public_subnet_b_cidr" {
  type        = string
  description = "CIDR for Public Subnet B (Needed for ALB)"
  default     = "10.0.2.0/24"
}

variable "private_subnet_a_cidr" {
  type        = string
  description = "CIDR for Private Subnet A"
  default     = "10.0.10.0/24"
}

variable "private_subnet_b_cidr" {
  type        = string
  description = "CIDR for Private Subnet B"
  default     = "10.0.20.0/24"
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway (costs ~$32/mo on real AWS)"
  type        = bool
  default     = false
}