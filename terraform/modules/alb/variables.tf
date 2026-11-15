variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "app_port" {
  type    = number
  default = 80
}

variable "target_type" {
  type        = string
  description = "'instance' for EC2 or 'ip' for EKS/ECS"
  default     = "ip"
}

variable "target_id" {
  type        = string
  description = "Optional EC2 instance ID or Pod/Node IP to attach"
  default     = ""
}

variable "health_check_path" {
  type    = string
  default = "/"
}