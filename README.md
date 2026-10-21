# 🚛 ELD Trip Planner

### _Cloud-Native Trucking Compliance Made Simple_

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green" alt="Django"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Kubernetes-326ce5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="MIT License"/>
</p>

<p align="center">
  <strong>A production-ready, cloud-native application that solves real-world ELD compliance challenges while showcasing modern DevOps excellence.</strong>
</p>

---

## 🌟 What This Project Delivers

**For Truckers:** Intelligent route planning with automated Hours of Service (HOS) compliance, ensuring drivers never violate federal regulations while optimizing their time on the road.

**For Engineers:** A comprehensive showcase of cloud-native architecture, demonstrating enterprise-grade DevOps practices from containerized development to Kubernetes orchestration.

This isn't just another CRUD app—it's a battle-tested solution that addresses the $2.8 billion problem of ELD compliance violations in the trucking industry.

---

## ✨ Feature Showcase

### 🎯 User-Facing Features

- **🗺️ Smart Route Planning** - Leverages Geoapify API for optimal routing
- **⏰ HOS Compliance Automation** - Automatically calculates mandatory rest breaks
- **📱 Interactive Dashboard** - Real-time map visualization with MapLibre GL JS
- **📊 Comprehensive Reporting** - Export compliance logs to JSON, CSV, and PDF
- **🔮 Predictive Analytics** - Generate ELD logs before trips begin

### 🚀 DevOps Excellence

- **🐳 Full Containerization** - Docker & Docker Compose for consistent environments
- **☸️ Kubernetes-Native** - Production-ready orchestration with health checks
- **🔄 GitOps Ready** - GitHub Actions CI/CD pipeline included
- **📦 Persistent Storage** - StatefulSet PostgreSQL with automatic backups
- **🌐 Production Networking** - Nginx Ingress with custom routing rules

---

## 🛠️ Technology Stack

| Layer              | Technologies                                             |
| ------------------ | -------------------------------------------------------- |
| **Frontend**       | React 18, Vite, Tailwind CSS, MapLibre GL JS             |
| **Backend**        | Python 3.11, Django 4.2, Django REST Framework, Gunicorn |
| **Database**       | PostgreSQL 15 with optimized queries and indexing        |
| **DevOps**         | Docker, Kubernetes, Nginx, GitHub Actions                |
| **Infrastructure** | Minikube (local), ready for AWS/GCP/Azure                |
| **APIs**           | Geoapify (Geocoding, Routing, Tiles)                     |

---

## 🚀 Quick Start Guide

### Prerequisites

```bash
# Required tools
docker --version          # >= 20.10
minikube version          # >= 1.25
kubectl version --client  # >= 1.24
```

### 🏠 Local Development (Fastest Path)

Perfect for active development with hot-reloading:

```bash
# 1. Clone and setup
git clone https://github.com/bruceminanga/Eld-trip-planner.git
cd Eld-trip-planner
cp .env.example .env.dev

# 2. Add your API keys to .env.dev
# GEOAPIFY_API_KEY=your_key_here

# 3. Launch the stack
docker-compose up --build

# 🎉 Visit http://localhost:5173
```

### ☸️ Production Simulation (Kubernetes)

Experience the full cloud-native deployment:

```bash
# 1. Initialize Minikube cluster
minikube start --memory=4096 --cpus=4
minikube addons enable ingress

# 2. Build images in Minikube's Docker environment
eval $(minikube -p minikube docker-env)

# Build backend
docker build -t eld-backend:latest -f backend/Dockerfile backend/

# Build frontend
docker build -t eld-frontend:latest -f frontend/Dockerfile.prod frontend/

# 3. Deploy to Kubernetes
kubectl apply -f kubernetes/base/
kubectl apply -f kubernetes/overlays/development/

# 4. Access your application
echo "🌐 Application URL: http://$(minikube ip)"
```

**🔧 Pro Tip:** Update `DJANGO_ALLOWED_HOSTS` in `kubernetes/base/configmap.yml` with your Minikube IP for proper routing.
