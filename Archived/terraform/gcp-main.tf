# terraform/gcp-main.tf

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.51.0"
    }
  }
}

provider "google" {
  project = "curious-clone-470108-d9" # GCP Project ID
  region  = "europe-west1"
}

resource "google_container_cluster" "primary" {
  name     = "eld-trip-planner-cluster"
  location = "europe-west1-b"
  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "default-worker-pool"
  location   = "europe-west1-b"
  cluster    = google_container_cluster.primary.name
  node_count = 2
  node_config {
    machine_type = "e2-medium"
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}

output "kubeconfig_command" {
  value = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --zone ${google_container_cluster.primary.location}"
}