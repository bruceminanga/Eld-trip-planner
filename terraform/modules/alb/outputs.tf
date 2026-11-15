output "alb_dns_name" {
  description = "The public DNS URL to access your application"
  value       = aws_lb.this.dns_name
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.this.arn
}

output "alb_security_group_id" {
  description = "Security Group ID of the ALB (used to allow traffic into EC2)"
  value       = aws_security_group.alb.id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.app.arn
}

