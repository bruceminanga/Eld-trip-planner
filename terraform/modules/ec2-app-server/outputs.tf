output "server_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.this.public_ip
}

output "app_url" {
  description = "Clickable URL for the application"
  value       = "http://${aws_instance.this.public_ip}"
}

output "instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.this.id
}