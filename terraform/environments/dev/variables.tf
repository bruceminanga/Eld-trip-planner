variable "project_name" {
  type        = string
  description = "Unique identifier for the project (e.g., m-treat, eld-trip-planner)"
}

variable "environment" {
  type        = string
  description = "Deployment environment name (dev, staging, prod)"
  default     = "dev"
}

variable "db_password" {
  type        = string
  description = "Password for the RDS PostgreSQL database"
  sensitive   = true
  default     = "stronglocalpassword"
}

variable "ingress_node_ip" {
  type        = string
  description = "IP address of the EKS node running ingress-nginx"
  default     = "10.0.0.3"
}

variable "ingress_node_port" {
  type        = number
  description = "NodePort exposed by ingress-nginx-controller"
  default     = 32479
}