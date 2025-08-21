🚚 ELD Compliant Trip Planner: A Full-Stack Application Deployed on Kubernetes

A full-stack web application built with a Django backend and React frontend, designed for a cloud-native deployment. This project demonstrates a complete DevOps lifecycle, from containerized local development to a production-ready deployment on a Kubernetes cluster.

The primary goal of this repository is to showcase a robust DevOps architecture, including infrastructure-as-code, containerization, and orchestration.
🏛️ Architecture & DevOps Showcase

This project is structured to mirror modern software development and deployment practices, separating the application code from the infrastructure configuration.
System Architecture Diagram (Production on Kubernetes)

(You can create a free diagram using draw.io and upload the image to a service like Imgur to get a link.)
Key DevOps Features

    Containerized Environments: The entire application stack (Frontend, Backend, Database) is fully containerized using Docker, ensuring consistency and portability between development and production.

    Orchestration with Kubernetes: The production environment is defined declaratively using Kubernetes manifests. This includes:

        Deployments for stateless frontend and backend services.

        A StatefulSet and PersistentVolumeClaim for the PostgreSQL database to ensure data persistence.

        ConfigMaps and Secrets to manage environment configuration and sensitive data securely.

        An Ingress controller to manage external traffic, routing API calls to the backend and all other requests to the frontend.

    Local Development with Docker Compose: A docker-compose.yml file provides a one-command setup (docker-compose up) for a complete local development environment, including hot-reloading for both the frontend and backend.

    Production-Ready Builds: The project utilizes multi-stage Docker builds to create lean, optimized, and secure production images. The final frontend image is a lightweight Nginx server hosting the static React build.

    CI/CD Ready: The project structure is prepared for a full CI/CD pipeline (e.g., using GitHub Actions) to automate building, testing, pushing images, and deploying to Kubernetes.

Challenges Solved & Lessons Learned

This project served as a deep dive into real-world DevOps challenges. Key problems diagnosed and solved include:

    Networking: Solved cross-container communication issues first with a Vite proxy in Docker Compose, then with a robust Ingress configuration in Kubernetes.

    Image Management: Mastered the minikube docker-env workflow to manage images between the local host and the cluster's internal Docker daemon, resolving common ImagePullBackOff errors.

    Configuration Management: Debugged DisallowedHost errors by correctly populating Kubernetes ConfigMaps and ensuring pods were restarted to receive the updated configuration.

    Resource Management: Addressed application stability issues by implementing resources.requests and resources.limits in the Kubernetes Deployment, preventing pod crashes due to Out Of Memory (OOM) errors.

🚀 Getting Started (Two Ways to Run)

You can run this project in two modes: a quick local development setup with Docker Compose, or the full production-like deployment on a local Kubernetes cluster.

1. Local Development (with Docker Compose)

This is the fastest way to get the application running on your local machine.
Prerequisites

    Docker & Docker Compose

Instructions

    Clone the repository:
    code Bash

IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END

git clone https://github.com/bruceminanga/Eld-trip-planner.git
cd Eld-trip-planner

Create the environment file:
Copy the example environment file. You will need to add your Geoapify API key to this file.
code Bash
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END

cp .env.example .env.dev

Now, open .env.dev with a text editor and add your GEOAPIFY_API_KEY.

Build and run the services:
code Bash

    IGNORE_WHEN_COPYING_START
    IGNORE_WHEN_COPYING_END


    docker-compose up --build



    The application will be available at http://localhost:5173. The backend API is at http://localhost:8000. Changes to the frontend or backend code will trigger automatic reloads.

2. Production Deployment (with Kubernetes & Minikube)

This method deploys the application to a local Kubernetes cluster, mirroring a real production environment.
Prerequisites

    Docker

    Minikube

    kubectl

Instructions

    Start Minikube:
    code Bash

IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END

minikube start --memory 4096 --cpus 4

Enable the Ingress addon:
code Bash
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END

minikube addons enable ingress

Point your shell to Minikube's Docker daemon:
This is a critical step. Run this command in the terminal you will use for building.
code Bash
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END

eval $(minikube -p minikube docker-env)

Build the Docker images:
Build the production images for both services. Replace yourusername with your Docker Hub username (or any other name).
code Bash
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END

docker build -t yourusername/eld-trip-planner-backend:0.1 -f backend/Dockerfile backend/
docker build -t yourusername/eld-trip-planner-frontend:0.1 -f frontend/Dockerfile.prod frontend/

Update Manifests:

    Ensure the image names in kubernetes/base/backend-deployment.yml and kubernetes/base/frontend-deployment.yml match the images you just built.

    Add your Geoapify API key to kubernetes/base/secret.yml.

    Add your Minikube IP (found via minikube ip) to the DJANGO_ALLOWED_HOSTS list in kubernetes/base/configmap.yml.

Apply the Kubernetes manifests:
code Bash
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END

kubectl apply -f kubernetes/base/
kubectl apply -f kubernetes/overlays/development/

Find the application IP address:
code Bash

    IGNORE_WHEN_COPYING_START
    IGNORE_WHEN_COPYING_END


    minikube ip



    Access the application:
    Open your browser and navigate to http://<MINIKUBE_IP> returned by the previous command.

✨ Features

    📍 Route Planning: Calculates driving routes between multiple locations.

    🗺️ Interactive Map: Displays the calculated route, start, pickup, and dropoff points.

    ⏱️ HOS Simulation: Automatically inserts required REST breaks and FUEL stops based on federal rules.

    📊 Trip Segments: Shows a detailed breakdown of the planned trip into driving, resting, and other segments.

    📑 ELD Log Generation: Automatically generates predicted daily ELD log data based on the plan.

    📈 ELD Log Visualization: Displays generated ELD data with a daily summary, a 24-hour timeline graph, and a detailed list of status changes.

    📄 Multi-Format Export: Allows users to export the generated trip plan and logs as JSON, CSV, and formatted PDF daily log sheets.

🛠️ Technology Stack
Category Technology
Backend Python, Django, Django REST Framework
Frontend React, Vite, Tailwind CSS, MapLibre GL JS, Axios
Database PostgreSQL (Production/Kubernetes), SQLite (Local Dev)
Infra & DevOps Docker, Kubernetes, Nginx, Docker Compose, GitHub
APIs Geoapify (Geocoding, Routing, Map Tiles)
