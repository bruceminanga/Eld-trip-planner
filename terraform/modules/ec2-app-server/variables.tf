variable "environment" {
  description = "Deployment environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the firewall is attached"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID where the server is placed"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN that the server needs IAM permission to access"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance size"
  type        = string
  default     = "t3.micro"
}

variable "instance_ami" {
  description = "AMI ID for the instance"
  type        = string
  default     = "ami-0c7217cdde317cfec"
}

variable "user_data" {
  description = "Startup bash script to execute on boot"
  type        = string
  default     = null
}