#!/bin/bash

# A comprehensive deployment and health-check script for the ELD Trip Planner application.
# It ensures that all components are running correctly after a deployment.

# Exit immediately if any command fails
set -e

# --- Configuration ---
# The namespace where the application is deployed.
NAMESPACE="eld-trip-planner"

# --- Style Definitions (for pretty output) ---
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[0;33m'
COLOR_RED='\033[0;31m'
COLOR_NC='\033[0m' # No Color

# --- Helper Function for Headers ---
print_header() {
  echo -e "\n${COLOR_YELLOW}--- $1 ---${COLOR_NC}"
}


# --- 1. DEPLOYMENT PHASE ---

print_header "Cleaning up previous migration Job (if it exists)"
# First, delete the old Job. It's safe to run every time.
kubectl delete job django-migrations -n "$NAMESPACE" --ignore-not-found=true

print_header "Applying all Kubernetes configurations from the development overlay"
# Apply everything using Kustomize. This creates/updates all resources.
kubectl apply -k kubernetes/overlays/development/


# --- 2. VERIFICATION PHASE ---

print_header "Verifying the migration Job"
# Wait for the migration job to be created and then complete.
echo "Waiting for migration Job to start..."
sleep 5 # Give it a few seconds for the job to be created by the controller

# Add a timeout for the migration job
MIGRATION_TIMEOUT=120 # 2 minutes
SECONDS=0
while ! kubectl get job django-migrations -n "$NAMESPACE" -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}' | grep "True"; do
  if [[ $SECONDS -gt $MIGRATION_TIMEOUT ]]; then
    echo -e "${COLOR_RED}ERROR: Migration Job timed out after $MIGRATION_TIMEOUT seconds.${COLOR_NC}"
    kubectl logs -l job-name=django-migrations -n "$NAMESPACE" --tail=50
    exit 1
  fi
  
  # Check if the job has failed
  if kubectl get job django-migrations -n "$NAMESPACE" -o jsonpath='{.status.conditions[?(@.type=="Failed")].status}' | grep "True"; then
    echo -e "${COLOR_RED}ERROR: Migration Job has failed!${COLOR_NC}"
    echo "Logs from the failed migration pod:"
    kubectl logs -l job-name=django-migrations -n "$NAMESPACE" --tail=50
    exit 1
  fi

  echo "Migration is running. Waiting..."
  sleep 5
  SECONDS=$((SECONDS + 5))
done
echo -e "${COLOR_GREEN}Migration Job completed successfully!${COLOR_NC}"


print_header "Checking rollout status of Deployments"
# The 'rollout status' command waits until the new pods are running and ready.
echo "Waiting for backend deployment to complete..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=2m

echo "Waiting for frontend deployment to complete..."
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=2m
echo -e "${COLOR_GREEN}Deployments rolled out successfully!${COLOR_NC}"


print_header "Current status of all pods"
# Display a neat table of all running pods.
kubectl get pods -n "$NAMESPACE"


print_header "Verifying network connectivity"
# Check that Services and Ingresses are configured.
echo "Services:"
kubectl get services -n "$NAMESPACE"
echo -e "\nIngresses:"
kubectl get ingress -n "$NAMESPACE"


print_header "Performing a final smoke test"
# Get the Minikube IP and try to curl the application.
MINIKUBE_IP=$(minikube ip)
if [ -z "$MINIKUBE_IP" ]; then
    echo -e "${COLOR_RED}Could not get Minikube IP. Cannot perform smoke test.${COLOR_NC}"
    exit 1
fi
echo "Attempting to reach the application at http://$MINIKUBE_IP/"

# Use curl to check if the frontend is responding with a 200 OK status.
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://"$MINIKUBE_IP"/)

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${COLOR_GREEN}SUCCESS: Frontend is accessible and returning HTTP 200 OK.${COLOR_NC}"
else
  echo -e "${COLOR_RED}FAILURE: Frontend returned HTTP status $HTTP_STATUS. Expected 200.${COLOR_NC}"
  echo "There might be an issue with the Ingress or the frontend service."
  exit 1
fi


# --- 3. CONCLUSION ---
echo -e "\n${COLOR_GREEN}✅ ✅ ✅ Deployment and verification complete! Everything looks perfect! ✅ ✅ ✅${COLOR_NC}"