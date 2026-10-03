# ☸️ M-Treat Platform — Kubernetes Architecture Lab

A security-conscious, declarative Kubernetes lab for learning cloud-native architecture, deployment hardening, and operational decision-making.

---

## 🧭 Kubernetes Features: When to Use & When to Skip

### 1. Networking & Traffic Routing

#### **Services (`ClusterIP`, `NodePort`, `LoadBalancer`)**
* **What it does:** Gives pods a stable IP address and internal DNS name while load-balancing traffic between replicas.
* **When to use:** Whenever pods need to talk to each other reliably without hardcoding dynamic pod IPs.
* **When to skip:** Never for web/API tiers. Only skip for headless stateful apps (like Kafka or Cassandra) that need direct pod-to-pod identity.

#### **Ingress & Gateway API**
* **What it does:** Acts as the entry point from outside the cluster, handling TLS/HTTPS termination and routing requests by hostname or URL path.
* **When to use:** When exposing multiple services over a single external IP (e.g., `api.example.com` → backend, `app.example.com` → frontend).
* **When to skip:** Internal microservices, background workers, or local testing via `kubectl port-forward`.

---

### 2. Security & Access Control

#### **Network Policies**
* **What it does:** Acts as a pod firewall controlling allowed ingress and egress traffic at L3/L4.
* **When to use:** Multi-tenant clusters, production environments, and anywhere you want a zero-trust model (e.g., stopping frontend pods from accessing internal cluster databases).
* **When to skip:** Early local prototyping where you just want to test if services can talk to each other without debugging firewall blocks.

#### **RBAC (`Role`, `RoleBinding`)**
* **What it does:** Restricts who can do what with the Kubernetes API.
* **When to use:** 
  * In-cluster apps/tools that manage resources (operators, CI runners, monitoring agents).
  * Limiting human developers to specific namespaces.
* **When to skip:** Standard web workloads. If your app only serves HTTP requests, disable the API token (`automountServiceAccountToken: false`) and skip RBAC entirely.

#### **Workload Hardening (`securityContext`)**
* **What it does:** Forces containers to run as non-root users, drops Linux capabilities, and makes root filesystems read-only.
* **When to use:** Always in production to prevent container breakout and lateral movement if an app gets compromised.
* **When to skip:** Quick throwaway experiments, or legacy containers that strictly require root privileges to boot.

---

### 3. Stability & Scheduling

#### **Resource Quotas & LimitRanges**
* **What it does:** Caps CPU, RAM, and pod counts per namespace to prevent any single app from exhausting cluster capacity.
* **When to use:** Multi-team environments, production clusters, or cost-budgeted namespaces.
* **When to skip:** Dedicated single-tenant clusters with only one known workload.

#### **Advanced Scheduling (`affinity`, `topologySpread`, `tolerations`)**
* **What it does:** Controls which nodes pods run on (e.g., spreading replicas across zones or placing workloads on GPU nodes).
* **When to use:** 
  * High availability: Ensuring 2 replicas don't sit on the same node during node crashes.
  * Specialized hardware: Targeting ARM, GPU, or cheap Spot instances.
* **When to skip:** Single-node lab clusters (Kind/Minikube) or uniform clusters where the default scheduler's placement is sufficient.

---

### 4. Scaling & Storage

#### **Autoscaling (HPA & KEDA)**
* **What it does:** Dynamically scales pod count based on CPU/RAM (HPA) or external event queues (KEDA).
* **When to use:** Production workloads with spiky traffic, or asynchronous workers reading from queues (Kafka, RabbitMQ, SQS).
* **When to skip:** Dev/staging environments, or apps where scaling would exceed strict resource quotas or overwhelm downstream databases.

#### **Persistent Volumes (`PersistentVolumeClaim`)**
* **What it does:** Attaches durable storage that outlives pod restarts and node migrations.
* **When to use:** Stateful apps like databases (Postgres, MySQL), file-storage systems, or persistent caches.
* **When to skip:** 12-factor stateless apps (frontends, stateless REST APIs). Use ephemeral `emptyDir` scratch disks for temporary files instead.

---

## 🚀 Quickstart

```bash
# Render all manifests
kubectl kustomize .

# Apply to cluster
kubectl apply -k .

# Forward frontend to localhost
kubectl port-forward -n frontend-dev svc/dev-frontend-service 8080:80