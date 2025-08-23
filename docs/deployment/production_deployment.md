# Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the NASA HWO Habitability Explorer in production environments, including NASA computing infrastructure, cloud platforms, and institutional deployments.

## Prerequisites

### System Requirements

**Minimum Production Requirements:**
- **CPU**: 8 cores (Intel Xeon or AMD EPYC recommended)
- **RAM**: 32GB minimum (64GB recommended for large datasets)
- **Storage**: 500GB SSD storage for application and database
- **Network**: High-speed internet connection (100+ Mbps)
- **Operating System**: Ubuntu 20.04 LTS, CentOS 8, or RHEL 8+

**Recommended Production Specifications:**
- **CPU**: 16+ cores with support for AVX2 instructions for ML optimization
- **RAM**: 128GB+ for large-scale data processing and model inference
- **Storage**: 2TB+ NVMe SSD with RAID configuration for redundancy
- **GPU**: NVIDIA Tesla or RTX series for accelerated ML computations (optional)
- **Network**: Redundant network connections with load balancing

### Software Dependencies

**Core Runtime:**
- Docker 20.10+ and Docker Compose v2
- Python 3.9+ (for bare metal deployments)
- Node.js 18+ LTS (for frontend builds)
- PostgreSQL 13+ (production database)
- Redis 6+ (caching and session management)

**Security Requirements:**
- SSL/TLS certificates (Let's Encrypt or institutional CA)
- Firewall configuration (UFW, iptables, or cloud security groups)
- Container security scanning (Clair, Anchore, or similar)
- Secrets management system (HashiCorp Vault, AWS Secrets Manager)

## Docker-based Production Deployment

### Production Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - REACT_APP_API_URL=https://api.yourdomain.com
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl-certs:/etc/ssl/certs:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - hwo-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://hwo_user:${DB_PASSWORD}@postgres:5432/hwo_db
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
      - LOG_LEVEL=WARNING
    volumes:
      - ./models:/app/models:ro
      - ./data:/app/data:rw
      - ./logs:/app/logs:rw
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    networks:
      - hwo-network

  postgres:
    image: postgres:13-alpine
    environment:
      - POSTGRES_DB=hwo_db
      - POSTGRES_USER=hwo_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - hwo-network

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - hwo-network

  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl-certs:/etc/ssl/certs:ro
    restart: unless-stopped
    depends_on:
      - frontend
      - backend
    networks:
      - hwo-network

volumes:
  postgres_data:
  redis_data:

networks:
  hwo-network:
    driver: bridge
```

### Environment Configuration

Create `.env.production`:

```bash
# Database Configuration
DB_PASSWORD=your_secure_database_password
DATABASE_URL=postgresql://hwo_user:${DB_PASSWORD}@postgres:5432/hwo_db

# Application Security
SECRET_KEY=your_secret_key_min_32_characters_long
JWT_SECRET=your_jwt_secret_for_authentication
ENCRYPTION_KEY=your_encryption_key_for_sensitive_data

# API Configuration
CORS_ORIGINS=["https://yourdomain.com", "https://api.yourdomain.com"]
API_V1_PREFIX=/api/v1
MAX_UPLOAD_SIZE=104857600  # 100MB

# Performance Configuration
WORKERS=4
WORKER_CONNECTIONS=1000
MAX_REQUESTS=1000
MAX_REQUESTS_JITTER=100

# Monitoring and Logging
LOG_LEVEL=INFO
SENTRY_DSN=your_sentry_dsn_for_error_tracking
PROMETHEUS_METRICS=true

# External Service Integration
NASA_EXOPLANET_ARCHIVE_API=https://exoplanetarchive.ipac.caltech.edu/TAP/sync
JWST_API_ENDPOINT=https://jwst.nasa.gov/api/v1
```

### Production Dockerfile Configuration

**Backend Production Dockerfile:**

```dockerfile
# backend/Dockerfile.prod
FROM python:3.9-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.9-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libopenblas-base \
    liblapack3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash hwo

# Set work directory and permissions
WORKDIR /app
RUN chown -R hwo:hwo /app
USER hwo

# Copy dependencies from builder stage
COPY --from=builder --chown=hwo:hwo /root/.local /home/hwo/.local

# Add local user bin to PATH
ENV PATH=/home/hwo/.local/bin:$PATH

# Copy application code
COPY --chown=hwo:hwo . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

**Frontend Production Dockerfile:**

```dockerfile
# frontend/Dockerfile.prod
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy SSL certificates placeholder
RUN mkdir -p /etc/ssl/certs

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

## Production Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=1r/s;

    # Backend upstream
    upstream backend {
        server backend:8000;
        keepalive 32;
    }

    # HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com api.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # Main application server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
        ssl_certificate_key /etc/ssl/certs/yourdomain.com.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        root /usr/share/nginx/html;
        index index.html;

        # Frontend routes
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Static assets caching
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # File upload endpoint with special handling
        location /api/upload/ {
            limit_req zone=upload burst=5 nodelay;
            client_max_body_size 100M;
            proxy_pass http://backend;
            proxy_request_buffering off;
            proxy_read_timeout 600s;
        }
    }

    # API subdomain
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/ssl/certs/api.yourdomain.com.crt;
        ssl_certificate_key /etc/ssl/certs/api.yourdomain.com.key;

        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Database Setup and Migration

### PostgreSQL Configuration

Create `db/postgresql.conf`:

```conf
# Connection settings
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 16GB

# Query performance
work_mem = 64MB
maintenance_work_mem = 1GB
checkpoint_segments = 64
wal_buffers = 64MB

# Logging
log_statement = 'mod'
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Extensions for scientific computing
shared_preload_libraries = 'pg_stat_statements'
```

### Database Initialization

Create `db/init.sql`:

```sql
-- Enable PostGIS for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create application schema
CREATE SCHEMA IF NOT EXISTS hwo;

-- Exoplanets table with spatial indexing
CREATE TABLE hwo.exoplanets (
    id SERIAL PRIMARY KEY,
    planet_name VARCHAR(100) NOT NULL UNIQUE,
    host_star VARCHAR(100) NOT NULL,
    coordinates GEOGRAPHY(POINT, 4326),
    discovery_method VARCHAR(50),
    discovery_year INTEGER,
    planet_radius REAL,
    planet_mass REAL,
    orbital_period REAL,
    semi_major_axis REAL,
    eccentricity REAL,
    equilibrium_temperature REAL,
    stellar_mass REAL,
    stellar_radius REAL,
    stellar_temperature REAL,
    habitability_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index for coordinate queries
CREATE INDEX idx_exoplanets_coordinates ON hwo.exoplanets USING GIST (coordinates);

-- Performance indexes
CREATE INDEX idx_exoplanets_habitability ON hwo.exoplanets (habitability_score DESC);
CREATE INDEX idx_exoplanets_discovery ON hwo.exoplanets (discovery_year, discovery_method);
CREATE INDEX idx_exoplanets_stellar_type ON hwo.exoplanets (stellar_temperature, stellar_mass);

-- User sessions table
CREATE TABLE hwo.user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE INDEX idx_sessions_expires ON hwo.user_sessions (expires_at);
```

## Monitoring and Observability

### Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "hwo_rules.yml"

scrape_configs:
  - job_name: 'hwo-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Application Performance Monitoring

Add to `docker-compose.prod.yml`:

```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning

  alertmanager:
    image: prom/alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

## Security Configuration

### SSL Certificate Management

**Using Let's Encrypt with Certbot:**

```bash
#!/bin/bash
# SSL certificate setup script

# Install Certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Generate certificates
certbot --nginx -d yourdomain.com -d api.yourdomain.com \
    --email your-email@nasa.gov \
    --agree-tos \
    --non-interactive

# Set up automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### Firewall Configuration

```bash
#!/bin/bash
# UFW firewall setup

# Enable UFW
ufw --force enable

# Default policies
ufw default deny incoming
ufw default allow outgoing

# SSH access
ufw allow 22/tcp

# HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Database (internal only)
ufw allow from 172.0.0.0/8 to any port 5432

# Monitoring (internal only)
ufw allow from 172.0.0.0/8 to any port 9090
ufw allow from 172.0.0.0/8 to any port 3000

# Apply rules
ufw reload
```

## Backup and Recovery

### Database Backup Strategy

Create `scripts/backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/backup/postgres"
DB_NAME="hwo_db"
DB_USER="hwo_user"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hwo_backup_$TIMESTAMP.sql"

# Create backup
pg_dump -h postgres -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Clean old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "$(date): Backup completed: $BACKUP_FILE.gz" >> /var/log/hwo_backup.log
```

### Data Recovery Procedures

Create `scripts/restore.sh`:

```bash
#!/bin/bash

# Usage: ./restore.sh backup_file.sql.gz

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="hwo_db"
DB_USER="hwo_user"

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | psql -h postgres -U $DB_USER -d $DB_NAME
else
    psql -h postgres -U $DB_USER -d $DB_NAME < $BACKUP_FILE
fi

echo "Database restored from $BACKUP_FILE"
```

## Performance Optimization

### Production Tuning

**Database Optimization:**

```sql
-- Vacuum and analyze regularly
SELECT schemaname, tablename, 
       last_vacuum, last_autovacuum,
       last_analyze, last_autoanalyze
FROM pg_stat_user_tables;

-- Update statistics
ANALYZE;

-- Reindex periodically
REINDEX DATABASE hwo_db;
```

**Application Optimization:**

```python
# backend/app/config.py
import os

class ProductionConfig:
    # Database connection pooling
    DATABASE_POOL_SIZE = 20
    DATABASE_POOL_OVERFLOW = 10
    DATABASE_POOL_RECYCLE = 3600
    
    # Redis caching
    REDIS_CACHE_TTL = 3600
    REDIS_MAX_CONNECTIONS = 50
    
    # API performance
    CORS_PREFLIGHT_MAX_AGE = 86400
    RESPONSE_COMPRESSION = True
    
    # Machine learning model optimization
    ML_BATCH_SIZE = 1000
    ML_N_JOBS = -1  # Use all available CPU cores
    
    # File processing limits
    MAX_UPLOAD_SIZE = 104857600  # 100MB
    CHUNK_SIZE = 8192
```

## Deployment Automation

### CI/CD Pipeline Configuration

Create `.github/workflows/deploy.yml`:

```yaml
name: Production Deployment

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Setup Python
      uses: actions/setup-python@v3
      with:
        python-version: '3.9'
        
    - name: Run tests
      run: |
        npm test
        python -m pytest
        
    - name: Build application
      run: |
        docker build -t hwo-frontend ./frontend
        docker build -t hwo-backend ./backend
        
    - name: Deploy to production
      run: |
        docker-compose -f docker-compose.prod.yml up -d
        
    - name: Health check
      run: |
        curl -f https://yourdomain.com/health
```

### Deployment Verification

Create `scripts/health_check.sh`:

```bash
#!/bin/bash

# Health check script for production deployment

DOMAIN="yourdomain.com"
API_DOMAIN="api.yourdomain.com"

echo "Starting health checks..."

# Frontend health check
if curl -f -s "https://$DOMAIN" > /dev/null; then
    echo "✓ Frontend is healthy"
else
    echo "✗ Frontend is down"
    exit 1
fi

# Backend health check
if curl -f -s "https://$API_DOMAIN/health" > /dev/null; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend is down"
    exit 1
fi

# Database connectivity check
if docker exec postgres pg_isready -U hwo_user -d hwo_db; then
    echo "✓ Database is healthy"
else
    echo "✗ Database is down"
    exit 1
fi

echo "All systems operational!"
```

## Troubleshooting Common Issues

### Performance Issues
- Monitor CPU, memory, and disk usage
- Check database query performance with pg_stat_statements
- Analyze application logs for bottlenecks
- Scale horizontally with load balancers if needed

### SSL Certificate Issues
- Verify certificate expiration dates
- Check Let's Encrypt renewal process
- Validate certificate chain completeness
- Test SSL configuration with SSL Labs

### Database Connection Issues
- Check PostgreSQL connection limits
- Monitor connection pooling statistics
- Verify network connectivity between containers
- Review database logs for errors

For additional support, consult the [troubleshooting guide](../troubleshooting/README.md) or submit issues to the GitHub repository.