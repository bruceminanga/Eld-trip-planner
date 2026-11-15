terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket       = "my-company-prod-terraform-state-bucket-test2"
    key          = "dev/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true # <--- Native S3 locking (replaces dynamodb_table)
  }
}