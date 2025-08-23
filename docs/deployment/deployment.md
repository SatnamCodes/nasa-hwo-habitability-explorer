# Deployment Guide - NASA HWO Habitability Explorer

## Overview

This deployment guide provides comprehensive instructions for deploying the NASA HWO Habitability Explorer to various environments, from development staging to production NASA infrastructure.

## Deployment Architecture

### Production Environment Architecture

```
                    🌐 NASA External Load Balancer
                              │
                    ┌─────────┴─────────┐
                    │   Nginx Proxy     │
                    │   (SSL/TLS)       │
                    └─────────┬─────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
    ┌──────▼──────┐  ┌────────▼────────┐ ┌──────▼──────┐
    │  Frontend   │  │    Backend      │ │  Database   │
    │  (React)    │  │   (FastAPI)     │ │ (PostgreSQL)│
    │  Container  │  │   Container     │ │  Container  │
    └─────────────┘  └─────────────────┘ └─────────────┘
           │                  │                  │
    ┌──────▼──────┐  ┌────────▼────────┐ ┌──────▼──────┐
    │   Static    │  │   ML Models     │ │   Redis     │
    │   Assets    │  │   Cache         │ │   Cache     │
    │   (S3/CDN)  │  │   (Volume)      │ │  Container  │
    └─────────────┘  └─────────────────┘ └─────────────┘
```

## Container Configuration

### 1. Docker Setup

**Frontend Dockerfile (`frontend/Dockerfile`):**
```dockerfile
# Multi-stage build for React frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and build
COPY . .
RUN npm run build

# Production stage with nginx
FROM nginx:1.24-alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile (`backend/Dockerfile`):**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 2. Docker Compose Configuration

**Production Docker Compose (`docker-compose.prod.yml`):**
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - web-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/hwo_explorer
      - REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT=production
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - redis
    volumes:
      - ./ml_models:/app/ml_models:ro
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - web-network
      - backend-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=hwo_explorer
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - backend-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - backend-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:1.24-alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./deployment/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./deployment/ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - web-network

volumes:
  postgres_data:
  redis_data:

networks:
  web-network:
    driver: bridge
  backend-network:
    driver: bridge
```

### 3. Nginx Configuration

**Production Nginx (`deployment/nginx/nginx.conf`):**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:80;
    }

    upstream backend {
        server backend:8000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=uploads:10m rate=1r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # HTTPS redirect
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # Main server
    server {
        listen 443 ssl http2;
        server_name hwo-explorer.nasa.gov;

        ssl_certificate /etc/ssl/certs/certificate.crt;
        ssl_certificate_key /etc/ssl/certs/private.key;

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers for API
            add_header Access-Control-Allow-Origin "https://hwo-explorer.nasa.gov" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        }

        # File upload routes with special handling
        location /api/upload/ {
            limit_req zone=uploads burst=5 nodelay;
            client_max_body_size 100M;
            client_body_timeout 300s;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_request_buffering off;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## Kubernetes Deployment

### 1. Kubernetes Manifests

**Namespace (`deployment/kubernetes/namespace.yaml`):**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: hwo-explorer
  labels:
    name: hwo-explorer
    environment: production
```

**ConfigMap (`deployment/kubernetes/configmap.yaml`):**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hwo-explorer-config
  namespace: hwo-explorer
data:
  ENVIRONMENT: "production"
  POSTGRES_DB: "hwo_explorer"
  POSTGRES_USER: "postgres"
  REDIS_URL: "redis://redis-service:6379/0"
  LOG_LEVEL: "INFO"
  WORKERS: "4"
```

**Secret (`deployment/kubernetes/secret.yaml`):**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: hwo-explorer-secret
  namespace: hwo-explorer
type: Opaque
data:
  POSTGRES_PASSWORD: <base64-encoded-password>
  SECRET_KEY: <base64-encoded-secret>
  JWT_SECRET: <base64-encoded-jwt-secret>
```

**Backend Deployment (`deployment/kubernetes/backend-deployment.yaml`):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
  namespace: hwo-explorer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: hwo-explorer-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          value: "postgresql://postgres:$(POSTGRES_PASSWORD)@postgres-service:5432/hwo_explorer"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: hwo-explorer-secret
              key: POSTGRES_PASSWORD
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: hwo-explorer-secret
              key: SECRET_KEY
        envFrom:
        - configMapRef:
            name: hwo-explorer-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: ml-models
          mountPath: /app/ml_models
          readOnly: true
      volumes:
      - name: ml-models
        persistentVolumeClaim:
          claimName: ml-models-pvc
```

**Frontend Deployment (`deployment/kubernetes/frontend-deployment.yaml`):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: hwo-explorer
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: hwo-explorer-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 2. Services

**Backend Service (`deployment/kubernetes/backend-service.yaml`):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: hwo-explorer
spec:
  selector:
    app: backend
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
  type: ClusterIP
```

**Ingress (`deployment/kubernetes/ingress.yaml`):**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hwo-explorer-ingress
  namespace: hwo-explorer
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
spec:
  tls:
  - hosts:
    - hwo-explorer.nasa.gov
    secretName: hwo-explorer-tls
  rules:
  - host: hwo-explorer.nasa.gov
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

## Environment-Specific Configurations

### 1. Development Environment

**Development Docker Compose (`docker-compose.dev.yml`):**
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      target: development
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:8000
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    command: npm start

  backend:
    build:
      context: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:devpassword@db:5432/hwo_explorer_dev
      - ENVIRONMENT=development
      - DEBUG=true
    volumes:
      - ./backend:/app
      - ./ml_models:/app/ml_models
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=hwo_explorer_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=devpassword
    ports:
      - "5433:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

volumes:
  postgres_dev_data:
```

### 2. Staging Environment

**Staging Configuration (`.env.staging`):**
```bash
# Database
DATABASE_URL=postgresql://hwo_user:${STAGING_DB_PASSWORD}@staging-db.nasa.gov:5432/hwo_explorer_staging
POSTGRES_PASSWORD=${STAGING_DB_PASSWORD}

# Application
ENVIRONMENT=staging
DEBUG=false
SECRET_KEY=${STAGING_SECRET_KEY}
JWT_SECRET=${STAGING_JWT_SECRET}

# External Services
NASA_API_KEY=${NASA_API_KEY}
REDIS_URL=redis://staging-redis.nasa.gov:6379/0

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/hwo-explorer/app.log

# Performance
WORKERS=2
MAX_CONNECTIONS=50
```

### 3. Production Environment

**Production Configuration (`.env.production`):**
```bash
# Database
DATABASE_URL=postgresql://hwo_user:${PROD_DB_PASSWORD}@prod-db.nasa.gov:5432/hwo_explorer
POSTGRES_PASSWORD=${PROD_DB_PASSWORD}

# Application
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=${PROD_SECRET_KEY}
JWT_SECRET=${PROD_JWT_SECRET}

# Security
ALLOWED_HOSTS=hwo-explorer.nasa.gov
CORS_ORIGINS=https://hwo-explorer.nasa.gov

# External Services
NASA_API_KEY=${NASA_API_KEY}
REDIS_URL=redis://prod-redis.nasa.gov:6379/0

# Performance
WORKERS=4
MAX_CONNECTIONS=100
CONNECTION_POOL_SIZE=20

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
LOG_LEVEL=WARNING
METRICS_ENDPOINT=true

# Backup
BACKUP_ENABLED=true
BACKUP_S3_BUCKET=hwo-explorer-backups
```

## Deployment Scripts

### 1. Automated Deployment Script

**Deployment Script (`deployment/scripts/deploy.sh`):**
```bash
#!/bin/bash

set -e

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
REGISTRY="nasa-registry.gov/hwo-explorer"

echo "🚀 Deploying NASA HWO Habitability Explorer"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(grep -v '^#' .env.$ENVIRONMENT | xargs)
else
    echo "❌ Environment file .env.$ENVIRONMENT not found"
    exit 1
fi

# Build and push images
echo "📦 Building Docker images..."
docker build -t $REGISTRY/backend:$VERSION ./backend
docker build -t $REGISTRY/frontend:$VERSION ./frontend

echo "📤 Pushing images to registry..."
docker push $REGISTRY/backend:$VERSION
docker push $REGISTRY/frontend:$VERSION

# Deploy based on environment
case $ENVIRONMENT in
    "development"|"dev")
        echo "🔧 Deploying to development environment..."
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    "staging")
        echo "🎭 Deploying to staging environment..."
        kubectl apply -f deployment/kubernetes/namespace.yaml
        kubectl apply -f deployment/kubernetes/configmap.yaml
        kubectl apply -f deployment/kubernetes/secret.yaml
        kubectl set image deployment/backend-deployment backend=$REGISTRY/backend:$VERSION -n hwo-explorer
        kubectl set image deployment/frontend-deployment frontend=$REGISTRY/frontend:$VERSION -n hwo-explorer
        kubectl rollout status deployment/backend-deployment -n hwo-explorer
        kubectl rollout status deployment/frontend-deployment -n hwo-explorer
        ;;
    "production"|"prod")
        echo "🌍 Deploying to production environment..."
        # Production deployment with blue-green strategy
        ./deployment/scripts/blue-green-deploy.sh $VERSION
        ;;
    *)
        echo "❌ Unknown environment: $ENVIRONMENT"
        echo "Usage: $0 [development|staging|production] [version]"
        exit 1
        ;;
esac

# Run post-deployment tasks
echo "🔍 Running post-deployment checks..."
./deployment/scripts/health-check.sh $ENVIRONMENT

# Database migrations
if [ "$ENVIRONMENT" != "development" ]; then
    echo "🗄️ Running database migrations..."
    kubectl exec -it deployment/backend-deployment -n hwo-explorer -- alembic upgrade head
fi

echo "✅ Deployment completed successfully!"
echo "🔗 Application URL: https://hwo-explorer-$ENVIRONMENT.nasa.gov"
```

### 2. Health Check Script

**Health Check (`deployment/scripts/health-check.sh`):**
```bash
#!/bin/bash

ENVIRONMENT=${1:-staging}
MAX_RETRIES=30
RETRY_INTERVAL=10

case $ENVIRONMENT in
    "development")
        BASE_URL="http://localhost:8000"
        ;;
    "staging")
        BASE_URL="https://hwo-explorer-staging.nasa.gov"
        ;;
    "production")
        BASE_URL="https://hwo-explorer.nasa.gov"
        ;;
esac

echo "🏥 Performing health checks for $ENVIRONMENT environment..."

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local retry_count=0
    
    echo "Checking $endpoint..."
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" || echo "000")
        
        if [ "$response" = "$expected_status" ]; then
            echo "✅ $endpoint is healthy (HTTP $response)"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        echo "⏳ Attempt $retry_count/$MAX_RETRIES failed (HTTP $response). Retrying in ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
    done
    
    echo "❌ $endpoint failed health check after $MAX_RETRIES attempts"
    return 1
}

# Check all endpoints
FAILED_CHECKS=0

check_endpoint "/health" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
check_endpoint "/api/planets?limit=1" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
check_endpoint "/" || FAILED_CHECKS=$((FAILED_CHECKS + 1))

# Database connectivity check
echo "Checking database connectivity..."
if [ "$ENVIRONMENT" != "development" ]; then
    kubectl exec -it deployment/backend-deployment -n hwo-explorer -- python -c "
from app.database import engine
try:
    with engine.connect() as conn:
        result = conn.execute('SELECT 1')
        print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
" || FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Summary
if [ $FAILED_CHECKS -eq 0 ]; then
    echo "🎉 All health checks passed!"
    exit 0
else
    echo "💥 $FAILED_CHECKS health check(s) failed!"
    exit 1
fi
```

### 3. Blue-Green Deployment Script

**Blue-Green Deployment (`deployment/scripts/blue-green-deploy.sh`):**
```bash
#!/bin/bash

set -e

VERSION=$1
NAMESPACE="hwo-explorer"
CURRENT_COLOR=$(kubectl get service frontend-service -n $NAMESPACE -o jsonpath='{.spec.selector.color}' || echo "blue")
NEW_COLOR=$([ "$CURRENT_COLOR" = "blue" ] && echo "green" || echo "blue")

echo "🔄 Starting blue-green deployment..."
echo "Current environment: $CURRENT_COLOR"
echo "Deploying to: $NEW_COLOR"

# Deploy new version to inactive environment
echo "📦 Deploying version $VERSION to $NEW_COLOR environment..."
kubectl patch deployment backend-deployment -n $NAMESPACE -p "{\"spec\":{\"template\":{\"metadata\":{\"labels\":{\"color\":\"$NEW_COLOR\"}},\"spec\":{\"containers\":[{\"name\":\"backend\",\"image\":\"nasa-registry.gov/hwo-explorer/backend:$VERSION\"}]}}}}"
kubectl patch deployment frontend-deployment -n $NAMESPACE -p "{\"spec\":{\"template\":{\"metadata\":{\"labels\":{\"color\":\"$NEW_COLOR\"}},\"spec\":{\"containers\":[{\"name\":\"frontend\",\"image\":\"nasa-registry.gov/hwo-explorer/frontend:$VERSION\"}]}}}}"

# Wait for new deployment to be ready
echo "⏳ Waiting for $NEW_COLOR deployment to be ready..."
kubectl rollout status deployment/backend-deployment -n $NAMESPACE
kubectl rollout status deployment/frontend-deployment -n $NAMESPACE

# Run smoke tests on new environment
echo "🧪 Running smoke tests on $NEW_COLOR environment..."
./deployment/scripts/smoke-tests.sh $NEW_COLOR

# Switch traffic to new environment
echo "🔀 Switching traffic to $NEW_COLOR environment..."
kubectl patch service backend-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"color\":\"$NEW_COLOR\"}}}"
kubectl patch service frontend-service -n $NAMESPACE -p "{\"spec\":{\"selector\":{\"color\":\"$NEW_COLOR\"}}}"

# Final health check
echo "🏥 Final health check..."
sleep 30
./deployment/scripts/health-check.sh production

echo "✅ Blue-green deployment completed successfully!"
echo "Active environment: $NEW_COLOR"
```

## Monitoring and Observability

### 1. Prometheus Configuration

**Prometheus Config (`deployment/monitoring/prometheus.yml`):**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'hwo-explorer-backend'
    static_configs:
      - targets: ['backend-service:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
    metrics_path: '/metrics'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 2. Logging Configuration

**Fluentd Configuration (`deployment/logging/fluentd.conf`):**
```xml
<source>
  @type tail
  path /var/log/hwo-explorer/*.log
  pos_file /var/log/fluentd/hwo-explorer.log.pos
  tag hwo-explorer.*
  format json
  time_key timestamp
  time_format %Y-%m-%d %H:%M:%S
</source>

<match hwo-explorer.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name hwo-explorer
  type_name logs
</match>
```

This deployment guide provides comprehensive instructions for deploying the NASA HWO Habitability Explorer across different environments with proper security, monitoring, and reliability considerations.
