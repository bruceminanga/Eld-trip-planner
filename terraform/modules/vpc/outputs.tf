output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB"
  value       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "public_subnet_a_id" {
  value = aws_subnet.public_a.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs for databases/apps"
  value       = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}