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

The primary goal of this repository is to showcase a robust and repeatable DevOps architecture.

<br>

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🏛️ DevOps & Architecture Showcase](#️-devops--architecture-showcase)
- [🧠 Challenges Solved & Lessons Learned](#-challenges-solved--lessons-learned)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Getting Started](#-getting-started)
- [📈 Future Improvements](#-future-improvements)

---

## ✨ Key Features

- 📍 **Intelligent Route Planning**: Calculates optimized driving routes between multiple locations using the Geoapify API.
- ⏱️ **Automated HOS Compliance**: Automatically inserts mandatory 30-minute rest breaks and fuel stops based on Hours of Service regulations.
- 🗺️ **Interactive Map Visualization**: Displays the full trip, stops, and segments on a dynamic MapLibre GL JS map.
- 📑 **Predictive ELD Log Generation**: Creates a complete, predicted daily log (On Duty, Driving, Off Duty) based on the generated trip plan.
- 📊 **Data Visualization & Export**: Displays the ELD log with a 24-hour timeline graph and allows exporting the trip plan and logs to JSON, CSV, and PDF.

---

## 🏛️ DevOps & Architecture Showcase

This project is meticulously structured to demonstrate modern, scalable, and maintainable software deployment practices.

### 🐳 Containerization with Docker

The entire application stack (Frontend, Backend, Database) is fully containerized, ensuring perfect consistency between all environments.

- **Development vs. Production Dockerfiles**: The project utilizes separate Dockerfiles for development (with hot-reloading via Vite) and production (a lean, multi-stage build served by Nginx), demonstrating a clear understanding of environment-specific needs.
- **Optimization**: Multi-stage Docker builds are used to create small, secure, and efficient production images, free of unnecessary build dependencies.

### ☸️ Orchestration with Kubernetes

The application is defined declaratively using Kubernetes manifests for a resilient, self-healing deployment.

- **High-Level Objects**: Utilizes **Deployments** for stateless services, a **StatefulSet** with a **PersistentVolumeClaim** for the database, and **Services** for stable internal networking.
- **Advanced Traffic Management**: A robust **Ingress** configuration routes external traffic, directing API calls to the backend and all other requests to the frontend, perfectly isolating the services.

### ⚙️ Configuration Management with Kustomize

To avoid repetitive and error-prone YAML, the project employs a Kustomize `base` and `overlay` structure.

- **DRY Principle**: The `base` directory contains the generic, structural definition of the application.
- **Environment-Specific Overlays**: The `overlays/development` directory contains only the specific configurations for that environment (e.g., ConfigMaps with `DEBUG=True`, Ingress rules, secrets, and image tags). This provides a clean separation of concerns and a single source of truth for each environment's configuration.

### 🚀 Automated Deployment Script

The `./deploy-to-dev.sh` script automates the entire Kubernetes deployment and verification process. It serves as the foundation for a future CI/CD pipeline and performs critical tasks:

- **Handles Job Lifecycle**: Correctly deletes the previous migration `Job` before applying the new one, respecting the immutable nature of Jobs.
- **Verifies Rollouts**: Uses `kubectl rollout status` to wait for Deployments to become healthy and ready.
- **Runs Health Checks**: Performs a final "smoke test" using `curl` to confirm the application is accessible and responding correctly after deployment.

---

## 🧠 Challenges Solved & Lessons Learned

This project was a journey through real-world DevOps problems, providing invaluable hands-on experience.

- **Mastering Ingress Routing**: Diagnosed and fixed a series of `404 Not Found` errors by evolving the Ingress configuration. This involved implementing correct URL rewrite rules (`rewrite-target`) and splitting the configuration into two separate Ingress resources to isolate the frontend and backend routing logic, preventing rule conflicts.

- **Solving the Immutable Job Problem**: Understood the fundamental difference between a `Deployment` and a `Job` in Kubernetes. Developed the correct, repeatable workflow of deleting and reapplying the migration Job to handle database schema changes reliably.

- **Bridging the Dev/Prod Divide**: Identified that the `Dockerfile` used for local development was unsuitable for a Kubernetes deployment. Created a separate, multi-stage `Dockerfile.prod` and implemented a Kustomize overlay to ensure the correct, optimized image was used.

- **Configuration Propagation**: Debugged `DisallowedHost` errors by tracing the configuration lifecycle, from updating the `ConfigMap` to ensuring the `Deployment` was correctly rolled out to make the pods pick up the new environment variables.

---

## 🛠️ Technology Stack

| Category           | Technology                                                 |
| :----------------- | :--------------------------------------------------------- |
| **Backend**        | Python, Django, Django REST Framework                      |
| **Frontend**       | React, Vite, Tailwind CSS, MapLibre GL JS, Axios           |
| **Database**       | PostgreSQL                                                 |
| **DevOps & Infra** | Docker, Kubernetes, Kustomize, Nginx, Docker Compose, Bash |
| **APIs**           | Geoapify (Geocoding, Routing, Map Tiles)                   |

---

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose
- Minikube
- kubectl

### 1. Local Development (for Coding)

This is the fastest way to run the application for coding, with hot-reloading enabled.

1.  **Clone & Setup Environment:**

    ```bash
    git clone https://github.com/bruceminanga/Eld-trip-planner.git
    cd Eld-trip-planner
    cp .env.example .env.dev
    ```

    Now, open `.env.dev` and add your `GEOAPIFY_API_KEY`.

2.  **Run with Docker Compose:**

    ```bash
    docker-compose up --build
    ```

3.  **Access:** The app is available at `http://localhost:5173`.

### 2. Kubernetes Deployment (for Integration)

This deploys the application to a local Kubernetes cluster, simulating a real-world development/staging environment.

1.  **Start Minikube & Enable Ingress:**

    ```bash
    minikube start --memory 4096 --cpus 4
    minikube addons enable ingress
    ```

2.  **Build Production Images:**

    > **Note:** Replace `your-dockerhub-username` with your actual username.

    ```bash
    # Build the backend image
    docker build -t your-dockerhub-username/eld-trip-planner-backend:0.4 -f backend/Dockerfile backend/

    # Build the frontend image
    docker build -t your-dockerhub-username/eld-trip-planner-frontend:0.5 -f frontend/Dockerfile.prod frontend/
    ```

3.  **Load Images into Minikube:**

    This makes the images available to the cluster without a remote registry.

    ```bash
    minikube image load your-dockerhub-username/eld-trip-planner-backend:0.4
    minikube image load your-dockerhub-username/eld-trip-planner-frontend:0.5
    ```

4.  **Configure the `development` Overlay:**

    All configuration is managed in `kubernetes/overlays/development/`.

    - **Image Tags**: Open `kustomization.yaml` and ensure the `newTag` values in the `images` block match the tags you just built.
    - **Allowed Hosts**: Open `configmap.yml` and add your Minikube IP (find via `minikube ip`) to `DJANGO_ALLOWED_HOSTS`.
    - **Secrets**: Open `secret.yml` and add your Base64-encoded `GEOAPIFY_API_KEY`.

5.  **Deploy the Application:**

    Run the automated deployment and verification script.

    ```bash
    ./deploy-to-dev.sh
    ```

6.  **Access the Application:**

    The script will output the IP address at the end. Open your browser and navigate to `http://<MINIKUBE_IP>`.
