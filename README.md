# 🚚 ELD Compliant Trip Planner

![GitHub language count](https://img.shields.io/github/languages/count/bruceminanga/Eld-trip-planner)
![GitHub top language](https://img.shields.io/github/languages/top/bruceminanga/Eld-trip-planner?color=blue&logo=python)
![License](https://img.shields.io/badge/license-MIT-green)

A full-stack web application built with a Django backend and React frontend, designed for a cloud-native deployment. This project demonstrates a complete DevOps lifecycle, from containerized local development to a production-ready deployment on a Kubernetes cluster.

The primary goal of this repository is to showcase a robust DevOps architecture, including infrastructure-as-code, containerization, and orchestration.

---

## 📋 Table of Contents

- [🏛️ Architecture & DevOps Showcase](#️-architecture--devops-showcase)
  - [System Architecture Diagram](#system-architecture-diagram)
  - [Key DevOps Features](#key-devops-features)
- [🧠 Challenges Solved & Lessons Learned](#-challenges-solved--lessons-learned)
- [🚀 Getting Started](#-getting-started)
  - [1. Local Development (Docker Compose)](#1-local-development-with-docker-compose)
  - [2. Production Deployment (Kubernetes & Minikube)](#2-production-deployment-with-kubernetes--minikube)
- [✨ Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)

---

## 🏛️ Architecture & DevOps Showcase

This project is structured to mirror modern software development and deployment practices, separating the application code from the infrastructure configuration.

### System Architecture Diagram

_(You can create a free diagram using [draw.io](https://draw.io), upload the image to a service like [Imgur](https://imgur.com/), and paste the link here.)_

### Key DevOps Features

- **Containerized Environments**: The entire application stack (Frontend, Backend, Database) is fully containerized using Docker, ensuring consistency and portability between development and production.

- **Orchestration with Kubernetes**: The production environment is defined declaratively using Kubernetes manifests. This includes:

  - **Deployments** for stateless frontend and backend services.
  - A **StatefulSet** and **PersistentVolumeClaim** for the PostgreSQL database to ensure data persistence.
  - **ConfigMaps** and **Secrets** to manage environment configuration and sensitive data securely.
  - An **Ingress** controller to manage external traffic, routing API calls to the backend and all other requests to the frontend.

- **Local Development with Docker Compose**: A `docker-compose.yml` file provides a one-command setup (`docker-compose up`) for a complete local development environment, including hot-reloading for both the frontend and backend.

- **Production-Ready Builds**: The project utilizes multi-stage Docker builds to create lean, optimized, and secure production images. The final frontend image is a lightweight Nginx server hosting the static React build.

- **CI/CD Ready**: The project structure is prepared for a full CI/CD pipeline (e.g., using GitHub Actions) to automate building, testing, pushing images, and deploying to Kubernetes.

---

## 🧠 Challenges Solved & Lessons Learned

This project served as a deep dive into real-world DevOps challenges. Key problems diagnosed and solved include:

- **Networking**: Solved cross-container communication issues first with a Vite proxy in Docker Compose, then with a robust Ingress configuration in Kubernetes.

- **Image Management**: Mastered the `minikube docker-env` workflow to manage images between the local host and the cluster's internal Docker daemon, resolving common `ImagePullBackOff` errors.

- **Configuration Management**: Debugged `DisallowedHost` errors by correctly populating Kubernetes ConfigMaps and ensuring pods were restarted to receive the updated configuration.

- **Resource Management**: Addressed application stability issues by implementing `resources.requests` and `resources.limits` in the Kubernetes Deployment, preventing pod crashes due to Out Of Memory (OOM) errors.

---

## 🚀 Getting Started

You can run this project in two modes: a quick local development setup with Docker Compose, or the full production-like deployment on a local Kubernetes cluster.

### 1. Local Development (with Docker Compose)

This is the fastest way to get the application running on your local machine.

#### Prerequisites

- Docker & Docker Compose

#### Instructions

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/bruceminanga/Eld-trip-planner.git
    cd Eld-trip-planner
    ```

2.  **Create the environment file:**
    Copy the example environment file. You will need to add your Geoapify API key to this file.

    ```bash
    cp .env.example .env.dev
    ```

    Now, open `.env.dev` with a text editor and add your `GEOAPIFY_API_KEY`.

3.  **Build and run the services:**

    ```bash
    docker-compose up --build
    ```

4.  **Access the application:**
    The application will be available at `http://localhost:5173`. The backend API is at `http://localhost:8000`. Changes to the frontend or backend code will trigger automatic reloads.

### 2. Production Deployment (with Kubernetes & Minikube)

This method deploys the application to a local Kubernetes cluster, mirroring a real production environment.

#### Prerequisites

- Docker
- Minikube
- kubectl

#### Instructions

1.  **Start Minikube:**

    ```bash
    minikube start --memory 4096 --cpus 4
    ```

2.  **Enable the Ingress addon:**

    ```bash
    minikube addons enable ingress
    ```

3.  **Point your shell to Minikube's Docker daemon:**

    > **Important:** This is a critical step. It makes your local Docker build command build images _inside_ Minikube's environment, so the cluster can find them without a remote registry.

    ```bash
    eval $(minikube -p minikube docker-env)
    ```

4.  **Build the Docker images:**
    Build the production images for both services. Replace `yourusername` with your Docker Hub username (or any other name).

    ```bash
    # Build the backend image
    docker build -t yourusername/eld-trip-planner-backend:0.1 -f backend/Dockerfile backend/

    # Build the frontend image
    docker build -t yourusername/eld-trip-planner-frontend:0.1 -f frontend/Dockerfile.prod frontend/
    ```

5.  **Update Kubernetes Manifests:**

    - Ensure the `image` names in `kubernetes/base/backend-deployment.yml` and `kubernetes/base/frontend-deployment.yml` match the images you just built (e.g., `yourusername/eld-trip-planner-backend:0.1`).
    - Add your Geoapify API key (Base64 encoded) to `kubernetes/base/secret.yml`.
    - Add your Minikube IP (find it via `minikube ip`) to the `DJANGO_ALLOWED_HOSTS` list in `kubernetes/base/configmap.yml`.

6.  **Apply the Kubernetes manifests:**

    ```bash
    # Apply the base resources (Deployments, Services, PVC, etc.)
    kubectl apply -f kubernetes/base/

    # Apply the overlay (Ingress, etc.)
    kubectl apply -f kubernetes/overlays/development/
    ```

7.  **Find the application IP address:**

    ```bash
    minikube ip
    ```

8.  **Access the application:**
    Open your browser and navigate to `http://<MINIKUBE_IP>` returned by the previous command.

---

## ✨ Features

- 📍 **Route Planning**: Calculates driving routes between multiple locations.
- 🗺️ **Interactive Map**: Displays the calculated route, start, pickup, and dropoff points.
- ⏱️ **HOS Simulation**: Automatically inserts required REST breaks and FUEL stops based on federal rules.
- 📊 **Trip Segments**: Shows a detailed breakdown of the planned trip into driving, resting, and other segments.
- 📑 **ELD Log Generation**: Automatically generates predicted daily ELD log data based on the plan.
- 📈 **ELD Log Visualization**: Displays generated ELD data with a daily summary, a 24-hour timeline graph, and a detailed list of status changes.
- 📄 **Multi-Format Export**: Allows users to export the generated trip plan and logs as JSON, CSV, and formatted PDF daily log sheets.

---

## 🛠️ Technology Stack

| Category         | Technology                                        |
| :--------------- | :------------------------------------------------ |
| **Backend**      | Python, Django, Django REST Framework             |
| **Frontend**     | React, Vite, Tailwind CSS, MapLibre GL JS, Axios  |
| **Database**     | PostgreSQL (Production/Kubernetes), SQLite (Dev)  |
| **Infra/DevOps** | Docker, Kubernetes, Nginx, Docker Compose, GitHub |
| **APIs**         | Geoapify (Geocoding, Routing, Map Tiles)          |
