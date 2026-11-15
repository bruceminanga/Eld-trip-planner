package main

# ==============================================================================
# PHASE 1: Mandatory Tagging Standard (Must have Environment, Owner, ManagedBy)
# ==============================================================================
deny contains msg if {
    some resource_type
    resource := input.resource[resource_type]
    some resource_name
    instance := resource[resource_name]
    
    # Check resources that support tags (e.g., S3, VPC, EC2)
    startswith(resource_type, "aws_")
    not endswith(resource_type, "_association")
    
    required_tags := {"Environment", "Owner", "ManagedBy"}
    existing_tags := {tag | some tag; _ := instance.tags[tag]}
    missing_tags := required_tags - existing_tags
    count(missing_tags) > 0
    
    msg := sprintf("[Phase 1] Resource '%v.%v' is missing mandatory tags: %v", [resource_type, resource_name, missing_tags])
}

# ==============================================================================
# PHASE 2: Remote State is Mandatory (Never allow local state backend)
# ==============================================================================
deny contains msg if {
    some backend_type
    backend := input.terraform[0].backend[backend_type]
    backend_type == "local"
    msg := "[Phase 2] Local state backend is forbidden. You must use a remote backend (S3, GCS, or HCP Terraform)."
}

# ==============================================================================
# PHASE 4: Treat Provisioners as a Last Resort (Ban local-exec & remote-exec)
# ==============================================================================
deny contains msg if {
    some resource_type
    resource := input.resource[resource_type]
    some resource_name
    instance := resource[resource_name]
    some provisioner in instance.provisioner
    some prov_type
    _ := provisioner[prov_type]
    msg := sprintf("[Phase 4] Resource '%v.%v' uses '%v' provisioner. Provisioners break idempotency; use cloud-init or user_data instead.", [resource_type, resource_name, prov_type])
}

# ==============================================================================
# PHASE 4: Critical Data Protection (Databases must have prevent_destroy = true)
# ==============================================================================
deny contains msg if {
    some db_name
    db := input.resource.aws_db_instance[db_name]
    not db.lifecycle.prevent_destroy == true
    msg := sprintf("[Phase 4] Database 'aws_db_instance.%v' must set 'lifecycle { prevent_destroy = true }' to protect against accidental deletion.", [db_name])
}

# ==============================================================================
# PHASE 5: Security Compliance (No 0.0.0.0/0 open SSH on Port 22)
# ==============================================================================
deny contains msg if {
    some sg_name
    sg := input.resource.aws_security_group[sg_name]
    some ingress in sg.ingress
    ingress.from_port <= 22
    ingress.to_port >= 22
    "0.0.0.0/0" in ingress.cidr_blocks
    msg := sprintf("[Phase 5] Security Group '%v' allows unrestricted SSH ingress (0.0.0.0/0 on port 22). Lock this down to specific CIDRs or VPN.", [sg_name])
}