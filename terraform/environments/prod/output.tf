output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "s3_bucket_name" {
  description = "S3 Storage Bucket Name"
  value       = module.s3.bucket_name
}

output "server_public_ip" {
  description = "Public IP for the App Server"
  value       = module.ec2.server_public_ip
}

output "app_url" {
  description = "Application URL"
  value       = module.ec2.app_url
}

output "website_url" {
  description = "The main URL to access the website"
  # If ALB is enabled, use the load balancer DNS. Otherwise, use the EC2 public IP!
  value = var.enable_alb ? "http://${module.alb.dns_name}" : "http://${module.ec2.server_public_ip}"
}
