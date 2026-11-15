output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "s3_bucket_name" {
  description = "S3 Storage Bucket Name"
  value       = module.s3.bucket_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL Endpoint"
  value       = module.rds.endpoint
}

output "eks_cluster_name" {
  description = "EKS Cluster Name"
  value       = module.eks.cluster_name
}

output "website_url" {
  description = "The public URL to access the application"
  value       = "http://${module.alb.alb_dns_name}:8080"
}