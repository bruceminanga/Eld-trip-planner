variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "subnet_ids" {
  type        = list(string)
  description = "VPC subnet IDs for the EKS control plane and worker nodes"
}

variable "create_node_group" {
  type        = bool
  description = "Create a managed EC2 node group (set true for real AWS; optional on Floci)"
  default     = false
}

variable "node_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}

variable "desired_nodes" {
  type    = number
  default = 2
}

variable "min_nodes" {
  type    = number
  default = 1
}

variable "max_nodes" {
  type    = number
  default = 3
}