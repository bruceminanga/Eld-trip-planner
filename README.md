# 🚚 ELD Compliant Trip Planner

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Badge"/>
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django Badge"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL Badge"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Badge"/>
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes Badge"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="MIT License"/>
</p>

A full-stack web application built with a Django backend and React frontend, architected for a complete, cloud-native deployment lifecycle. This project demonstrates modern DevOps principles, from containerized local development to a production-ready, orchestrated deployment on Kubernetes using Kustomize.

The primary goal of this repository is to showcase a robust and repeatable DevOps architecture while solving real-world trucking industry compliance challenges.

> **🎯 Perfect for DevOps Portfolio Reviews**: This project demonstrates enterprise-grade deployment patterns, infrastructure as code, and cloud-native architecture principles.

<br>

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🏛️ DevOps & Architecture Showcase](#️-devops--architecture-showcase)
- [🧠 Challenges Solved & Lessons Learned](#-challenges-solved--lessons-learned)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Getting Started](#-getting-started)
- [📁 Project Structure](#-project-structure)
- [🔧 Configuration Management](#-configuration-management)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [📈 Future Improvements](#-future-improvements)
- [🤝 Contributing](#-contributing)

---

## ✨ Key Features

### 🚛 Trucking Industry Solutions

- 📍 **Intelligent Route Planning**: Calculates optimized driving routes between multiple locations using the Geoapify API
- ⏱️ **Automated HOS Compliance**: Automatically inserts mandatory 30-minute rest breaks and fuel stops based on Hours of Service regulations
- 🗺️ **Interactive Map Visualization**: Displays the full trip, stops, and segments on a dynamic MapLibre GL JS map
- 📑 **Predictive ELD Log Generation**: Creates a complete, predicted daily log (On Duty, Driving, Off Duty) based on the generated trip plan
- 📊 **Data Visualization & Export**: Displays the ELD log with a 24-hour timeline graph and allows exporting to JSON, CSV, and PDF

### 🔧 Technical Excellence

- 🌐 **Full-Stack Architecture**: Decoupled React frontend with Django REST API backend
- 🔒 **Security First**: External secret management, environment isolation, and secure container practices
- 📦 **Cloud-Native Design**: Stateless services, health checks, and horizontal scalability
- 🔄 **CI/CD Ready**: Automated deployment scripts and infrastructure as code

---

## 🏛️ DevOps & Architecture Showcase

This project is meticulously structured to demonstrate modern, scalable, and maintainable software deployment practices.

### 🐳 Containerization with Docker

The entire application stack (Frontend, Backend, Database) is fully containerized, ensuring perfect consistency between all environments.

- **Multi-Environment Strategy**: Separate Dockerfiles for development (hot-reloading via Vite) and production (multi-stage builds with Nginx)
- **Security & Optimization**: Multi-stage builds create minimal attack surface with optimized image sizes
- **Development Experience**: Docker Compose setup enables instant local development with full stack

### ☸️ Orchestration with Kubernetes

Production-ready Kubernetes deployment with enterprise patterns and best practices.

- **Resilient Architecture**: Deployments for stateless services, StatefulSets for persistent data
- **Advanced Networking**: Ingress controllers with path-based routing and SSL termination ready
- **Resource Management**: CPU/memory limits, requests, and horizontal pod autoscaling configuration
- **Health & Monitoring**: Liveness and readiness probes ensure self-healing capabilities

### ⚙️ Configuration Management with Kustomize

Environment-specific configuration without YAML duplication.

- **Base + Overlay Pattern**: Generic base configurations with environment-specific overlays
- **GitOps Ready**: Declarative configuration management supporting multiple environments
- **Secret Management**: External secrets integration with HashiCorp Vault for sensitive data
- **Immutable Deployments**: Configuration changes trigger controlled rollouts

### 🚀 Automated Deployment Pipeline

The `./deploy-to-dev.sh` script demonstrates CI/CD automation principles.

- **Job Lifecycle Management**: Handles Kubernetes Job immutability for database migrations
- **Health Verification**: Automated rollout status checks and application health validation
- **Rollback Capability**: Failed deployments can be quickly reverted
- **Smoke Testing**: Post-deployment verification ensures application functionality

---

## 🧠 Challenges Solved & Lessons Learned

Real-world DevOps problems encountered and solved during development.

### 🔀 Ingress Traffic Routing Mastery

**Challenge**: Complex `404 Not Found` errors with mixed frontend/backend traffic
**Solution**: Implemented path-based routing with proper URL rewrites and separate Ingress resources
**Learning**: Microservices require careful traffic management and service mesh considerations

### 🔄 Kubernetes Job Management

**Challenge**: Database migration Jobs are immutable and can't be updated in-place
**Solution**: Automated Job deletion and recreation workflow in deployment scripts
**Learning**: Understanding Kubernetes resource lifecycle is crucial for automation

### 🌍 Environment Configuration Propagation

**Challenge**: Django `DisallowedHost` errors despite correct ConfigMap updates
**Solution**: Traced configuration lifecycle from ConfigMap → Pod → Application startup
**Learning**: Configuration changes require Pod restarts and proper deployment rollout verification

### 🏗️ Multi-Stage Build Optimization

**Challenge**: Development Dockerfile unsuitable for production Kubernetes deployment
**Solution**: Created optimized production Dockerfile with Nginx serving static assets
**Learning**: Different environments require different optimization strategies

---

## 🛠️ Technology Stack

### Core Application

| Layer        | Technology                                          |
| :----------- | :-------------------------------------------------- |
| **Frontend** | React 18, Vite, Tailwind CSS, MapLibre GL JS, Axios |
| **Backend**  | Python 3.11, Django 4.2, Django REST Framework      |
| **Database** | PostgreSQL 15 with persistent volumes               |
| **APIs**     | Geoapify (Geocoding, Routing, Map Tiles)            |

### DevOps & Infrastructure

| Category             | Technology                                     |
| :------------------- | :--------------------------------------------- |
| **Containerization** | Docker, Docker Compose, Multi-stage builds     |
| **Orchestration**    | Kubernetes, Minikube, kubectl                  |
| **Configuration**    | Kustomize, ConfigMaps, Secrets                 |
| **Security**         | External Secrets, HashiCorp Vault, RBAC        |
| **Networking**       | Ingress Controllers, Services, NetworkPolicies |
| **Automation**       | Bash scripting, kubectl, CI/CD ready           |

---

## 📁 Project Structure

```
ELD-TRIP-PLANNER/
├── backend/                    # Django REST API
│   ├── Dockerfile             # Development container
│   ├── Dockerfile.prod        # Production optimized
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React application
│   ├── Dockerfile.prod        # Production with Nginx
│   └── package.json           # Node.js dependencies
├── kubernetes/                 # K8s manifests
│   ├── base/                  # Base configurations
│   │   ├── backend-deployment.yml
│   │   ├── frontend-deployment.yml
│   │   ├── postgres-pvc.yml
│   │   └── postgres-statefulset.yml
│   └── overlays/              # Environment-specific
│       └── development/       # Dev environment
│           ├── configmap.yml  # Environment variables
│           ├── external-secret.yml  # Vault integration
│           ├── ingress.yml    # Traffic routing
│           └── kustomization.yml    # Overlay config
├── deploy-to-dev.sh           # Automated deployment
├── docker-compose.yml         # Local development
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have these tools installed:

```bash
# Required tools
- Docker & Docker Compose (v2.0+)
- Minikube (v1.25+)
- kubectl (v1.24+)

# Verify installations
docker --version
docker-compose --version
minikube version
kubectl version --client
```

### 🏠 Option 1: Local Development (Recommended for Coding)

Perfect for rapid development with hot-reloading and debugging.

1. **Clone and Configure Environment:**

   ```bash
   git clone https://github.com/bruceminanga/Eld-trip-planner.git
   cd Eld-trip-planner
   cp .env.example .env.dev
   ```

2. **Add API Configuration:**

   Edit `.env.dev` and add your Geoapify API key:

   ```env
   GEOAPIFY_API_KEY=your_api_key_here
   ```

3. **Start Development Stack:**

   ```bash
   docker-compose up --build
   ```

4. **Access Application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000/api/`
   - Admin Panel: `http://localhost:8000/admin/`

### ☸️ Option 2: Kubernetes Deployment (Production Simulation)

Demonstrates full production deployment workflow.

1. **Initialize Kubernetes Environment:**

   ```bash
   # Start Minikube with adequate resources
   minikube start --memory 4096 --cpus 4

   # Enable required addons
   minikube addons enable ingress
   minikube addons enable metrics-server
   ```

2. **Build and Load Production Images:**

   ```bash
   # Build optimized production images
   docker build -t your-username/eld-backend:latest -f backend/Dockerfile.prod backend/
   docker build -t your-username/eld-frontend:latest -f frontend/Dockerfile.prod frontend/

   # Load into Minikube (avoids registry push)
   minikube image load your-username/eld-backend:latest
   minikube image load your-username/eld-frontend:latest
   ```

3. **Configure Environment Variables:**

   Update `kubernetes/overlays/development/`:

   - `configmap.yml`: Add Minikube IP to `DJANGO_ALLOWED_HOSTS`
   - `secret.yml`: Base64 encode your Geoapify API key
   - `kustomization.yml`: Update image tags to match your builds

4. **Deploy to Kubernetes:**

   ```bash
   # Run automated deployment with health checks
   ./deploy-to-dev.sh

   # Monitor deployment progress
   kubectl get pods -w
   ```

5. **Access Production Environment:**

   ```bash
   # Get Minikube IP and access application
   minikube ip
   # Navigate to http://<MINIKUBE_IP>
   ```

---

## 🔧 Configuration Management

### Environment Variables

| Variable               | Description           | Required | Default        |
| ---------------------- | --------------------- | -------- | -------------- |
| `DEBUG`                | Django debug mode     | No       | `False`        |
| `DJANGO_ALLOWED_HOSTS` | Allowed hostnames     | Yes      | `localhost`    |
| `GEOAPIFY_API_KEY`     | API key for routing   | Yes      | -              |
| `DATABASE_URL`         | PostgreSQL connection | No       | Auto-generated |

### Secret Management

The project uses external secrets for sensitive data:

```yaml
# kubernetes/overlays/development/external-secret.yml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: eld-secrets
spec:
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
```

---

## 🧪 Testing & Quality Assurance

### Automated Health Checks

The deployment includes comprehensive health verification:

- **Liveness Probes**: Ensure containers are running
- **Readiness Probes**: Verify services are accepting traffic
- **Post-Deployment Testing**: Automated smoke tests validate functionality

### Manual Testing Checklist

- [ ] Frontend loads without console errors
- [ ] API endpoints respond correctly
- [ ] Database migrations complete successfully
- [ ] Map visualization renders properly
- [ ] Route planning generates valid results

---

## 📈 Future Improvements

### Infrastructure Enhancements

- [ ] **Helm Charts**: Replace Kustomize with Helm for templating
- [ ] **GitOps Integration**: ArgoCD/FluxCD for automated deployments
- [ ] **Monitoring Stack**: Prometheus, Grafana, and Alertmanager
- [ ] **Service Mesh**: Istio for advanced traffic management
- [ ] **Multi-Environment**: Staging and production overlays

### Application Features

- [ ] **Real-time Updates**: WebSocket integration for live trip tracking
- [ ] **Mobile App**: React Native companion application
- [ ] **Advanced Analytics**: Trip optimization and fuel efficiency metrics
- [ ] **Integration APIs**: Connect with fleet management systems
- [ ] **Offline Mode**: PWA capabilities for limited connectivity areas

### Security & Compliance

- [ ] **RBAC Implementation**: Role-based access control
- [ ] **API Rate Limiting**: Protect against abuse
- [ ] **Audit Logging**: Compliance and security monitoring
- [ ] **Vulnerability Scanning**: Container and dependency security

---

## 🤝 Contributing

This project welcomes contributions! Here's how to get started:

### Development Workflow

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/Eld-trip-planner.git
   cd Eld-trip-planner
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Local Development**

   ```bash
   docker-compose up --build
   ```

4. **Test Your Changes**

   - Run the application locally
   - Test Kubernetes deployment
   - Verify all health checks pass

5. **Submit Pull Request**
   - Include clear description of changes
   - Reference any related issues
   - Ensure CI checks pass

### Code Standards

- **Python**: Follow PEP 8 styling guidelines
- **JavaScript**: Use ESLint and Prettier configurations
- **Docker**: Multi-stage builds for production images
- **Kubernetes**: Follow security and resource best practices

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Geoapify** for routing and mapping services
- **Kubernetes Community** for excellent documentation
- **Django & React Teams** for robust frameworks
- **DevOps Community** for sharing best practices

---

<p align="center">
  <strong>Built with ❤️ for the DevOps community</strong><br>
  <sub>Demonstrating production-ready cloud-native architecture</sub>
</p>
