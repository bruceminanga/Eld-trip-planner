# 🚚 ELD Compliant Trip Planner

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Badge"/>
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django Badge"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL Badge"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Badge"/>
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes Badge"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="MIT License"/>
</p>

A full-stack web application built with a Django backend and React frontend, architected for a complete, cloud-native deployment lifecycle. This project demonstrates modern DevOps principles, from containerized local development to a production-ready, orchestrated deployment on Kubernetes using Kustomize and an enterprise-grade secrets management workflow.

The primary goal of this repository is to showcase a robust and repeatable DevOps architecture while solving real-world trucking industry compliance challenges.

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🏛️ DevOps & Architecture Showcase](#️-devops--architecture-showcase)
- [🧠 Challenges Solved & Lessons Learned](#-challenges-solved--lessons-learned)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Getting Started](#-getting-started)
- [📁 Project Structure](#-project-structure)
- [📈 Future Improvements](#-future-improvements)

---

## ✨ Key Features

### 🚛 Trucking Industry Solutions

- 📍 **Intelligent Route Planning**: Calculates optimized driving routes between multiple locations using the Geoapify API
- ⏱️ **Automated HOS Compliance**: Automatically inserts mandatory 30-minute rest breaks based on Hours of Service regulations
- 🗺️ **Interactive Map Visualization**: Displays the full trip, stops, and segments on a dynamic MapLibre GL JS map
- 📑 **Predictive ELD Log Generation**: Creates a complete, predicted daily log (On Duty, Driving, Off Duty) based on the generated trip plan
- 📊 **Data Visualization & Export**: Displays the ELD log with a 24-hour timeline graph and allows exporting to JSON, CSV, and PDF

### 🔧 Technical Excellence

- 🌐 **Full-Stack Architecture**: Decoupled React frontend with a Django REST API backend
- 🔒 **Enterprise-Grade Security**: Secrets are managed externally in HashiCorp Vault and dynamically injected into the cluster via the External Secrets Operator
- 📦 **Cloud-Native Design**: Stateless services architected for resilience and scalability
- 🔄 **CI/CD Ready**: An automated deployment script (`./deploy-to-dev.sh`) provides the foundation for a full CI/CD pipeline

---

## 🏛️ DevOps & Architecture Showcase

This project is meticulously structured to demonstrate modern, scalable, and maintainable software deployment practices.

### 🐳 Containerization with Docker

The entire application stack is fully containerized, ensuring perfect consistency between all environments.

- **Multi-Environment Strategy**: Separate Dockerfiles for development (with hot-reloading) and production (lean, multi-stage builds served by Nginx)
- **Security & Optimization**: Multi-stage builds create minimal, secure images by excluding build-time dependencies from the final image

### ☸️ Orchestration with Kubernetes

The application is defined declaratively for a resilient, self-healing deployment.

- **High-Level Objects**: Utilizes Deployments for stateless services, a StatefulSet with a PersistentVolumeClaim for the database, and Services for stable internal networking
- **Advanced Traffic Management**: A robust, dual-Ingress configuration cleanly separates routing logic for the frontend and the API, preventing rule conflicts

### ⚙️ Configuration Management with Kustomize

To avoid repetitive and error-prone YAML, the project employs a Kustomize base and overlay structure.

- **DRY Principle**: The `base` directory contains the generic, structural definition of the application
- **Environment-Specific Overlays**: The `overlays/development` directory contains only the specific configurations (e.g., ConfigMaps with `DEBUG=True`, Ingress rules, and image tags), providing a single source of truth for each environment

### 🔒 Secure GitOps with External Secrets Operator (ESO)

This project implements the industry-best-practice for secrets management in a GitOps workflow.

- **No Secrets in Git**: The Git repository contains zero secret material, encrypted or otherwise
- **Single Source of Truth**: Secrets are stored in an external provider (simulated with an in-cluster Vault dev server)
- **Declarative Pointers**: The Git repository contains a safe ExternalSecret manifest that acts as a pointer, telling the in-cluster operator where to fetch the real secrets

---

## 🧠 Challenges Solved & Lessons Learned

This project was a journey through real-world DevOps problems, providing invaluable hands-on experience.

### 🔀 Mastering Ingress Routing

**Challenge**: Diagnosed and fixed a series of `404 Not Found` errors by evolving the Ingress configuration  
**Solution**: Implemented correct URL rewrite rules (`rewrite-target`) and split the configuration into two separate Ingress resources to isolate the frontend and API routing logic

### 🔄 Solving the Immutable Job Problem

**Challenge**: Understanding the fundamental difference between a Deployment and a Job in Kubernetes  
**Solution**: Developed the correct, repeatable workflow of deleting and reapplying the migration Job via an automated script to handle database schema changes reliably

### 🐛 Debugging the Full Stack

**Challenge**: Traced a single user request from the browser, through the Kubernetes Ingress and Service layers, to the Django application, and finally to the database  
**Solution**: Systematically debugged issues at each step (browser cache, Kustomize configs, Docker builds, and database migrations)

### ⚡ Resolving Operator Race Conditions

**Challenge**: Overcame a frustrating deployment failure by identifying a race condition between the Helm installation of an operator and the kubectl apply command  
**Solution**: Implemented the `helm install --wait` flag and added a sleep command to the deployment script, demonstrating a deep understanding of Kubernetes' asynchronous nature

---

## 🛠️ Technology Stack

| Category           | Technology                                       |
| :----------------- | :----------------------------------------------- |
| **Backend**        | Python, Django, Django REST Framework            |
| **Frontend**       | React, Vite, Tailwind CSS, MapLibre GL JS, Axios |
| **Database**       | PostgreSQL                                       |
| **DevOps & Infra** | Docker, Kubernetes, Kustomize, Helm, Nginx, Bash |
| **Security**       | External Secrets Operator (ESO), HashiCorp Vault |
| **APIs**           | Geoapify (Geocoding, Routing, Map Tiles)         |

---

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- Minikube
- kubectl
- Helm

### 🏠 1. Local Development (for Coding)

This is the fastest way to run the application for coding, with hot-reloading enabled.

1. **Clone & Setup Environment:**

   ```bash
   git clone https://github.com/bruceminanga/Eld-trip-planner.git
   cd Eld-trip-planner
   cp .env.example .env.dev
   ```

   Now, open `.env.dev` and add your `GEOAPIFY_API_KEY` and a `DJANGO_SECRET_KEY`.

2. **Run with Docker Compose:**

   ```bash
   docker-compose up --build
   ```

3. **Access:** The app is at `http://localhost:5173`.

### ☸️ 2. Kubernetes Deployment (for Integration)

This deploys the application to a local Kubernetes cluster, simulating a real-world, secure DevOps workflow.

1. **Start Minikube & Enable Ingress:**

   ```bash
   minikube start --memory 4096 --cpus 4
   minikube addons enable ingress
   ```

2. **Build Production Images:**

   ```bash
   # Build the backend image
   docker build -t your-dockerhub-username/eld-trip-planner-backend:0.4 -f backend/Dockerfile .

   # Build the frontend image
   docker build -t your-dockerhub-username/eld-trip-planner-frontend:0.5 -f frontend/Dockerfile.prod frontend/
   ```

3. **Load Images into Minikube:**

   ```bash
   minikube image load your-dockerhub-username/eld-trip-planner-backend:0.4
   minikube image load your-dockerhub-username/eld-trip-planner-frontend:0.5
   ```

4. **Install & Configure External Secrets:**

   This one-time setup installs the operator and creates secrets in the in-cluster Vault.

   ```bash
   # Install the operator and wait for it to be ready
   helm repo add external-secrets https://charts.external-secrets.io && helm repo update
   helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace --wait

   # Apply the base which includes the Vault pod
   kubectl apply -k kubernetes/base/

   # Wait for Vault to start
   echo "Waiting for Vault pod to be ready..."
   kubectl wait --for=condition=ready pod/vault --timeout=120s

   # Exec into Vault and create the secrets
   kubectl exec -it vault -- sh -c 'export VAULT_ADDR="http://127.0.0.1:8200" && export VAULT_TOKEN="root" && vault kv put secret/eld-trip-planner GEOAPIFY_API_KEY="your-real-key" SECRET_KEY="your-django-secret"'
   ```

5. **Configure the development Overlay:**

   All configuration is managed in `kubernetes/overlays/development/`.

   - **Image Tags**: Open `kustomization.yaml` and ensure the `newTag` values match the tags you just built
   - **Allowed Hosts**: Open `configmap.yml` and add your Minikube IP (find via `minikube ip`) to `DJANGO_ALLOWED_HOSTS`

6. **Deploy the Application:**

   Run the automated deployment and verification script.

   ```bash
   ./deploy-to-dev.sh
   ```

7. **Access the Application:**

   The script will output the IP address at the end. Open your browser and navigate to `http://<MINIKUBE_IP>`.

---

## 📁 Project Structure

```
ELD-TRIP-PLANNER/
├── backend/                    # Django REST API
├── frontend/                   # React application
├── kubernetes/                 # K8s manifests
│   ├── base/                  # Generic resource definitions
│   │   ├── backend-deployment.yml
│   │   ├── frontend-deployment.yml
│   │   ├── postgres-statefulset.yml
│   │   ├── vault-dev.yaml
│   │   └── kustomization.yaml
│   └── overlays/              # Environment-specific configs
│       └── development/
│           ├── configmap.yml
│           ├── external-secret.yml  # Pointer to Vault
│           ├── secret-store.yml     # ESO configuration
│           ├── ingress.yml
│           └── kustomization.yaml
├── deploy-to-dev.sh           # Automated deployment script
├── docker-compose.yml         # Local development setup
└── README.md                  # This file
```

---

## 📈 Future Improvements

- **CI/CD Pipeline**: Automate the entire build, test, and deploy process using GitHub Actions
- **Monitoring & Logging**: Integrate Prometheus and Grafana for monitoring application metrics and Loki for centralized log aggregation
- **GitOps Integration**: Add Argo CD to automatically synchronize the cluster state with the Git repository
- **Create a Production Overlay**: Build out a `kubernetes/overlays/production` directory with production-ready settings (DEBUG=False, higher replica counts, real Vault backend, etc.)

---

<p align="center">
  <strong>Built with ❤️ for the DevOps community</strong><br>
  <sub>Demonstrating production-ready cloud-native architecture</sub>
</p>
