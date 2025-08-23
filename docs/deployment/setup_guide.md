# HWO Habitability Explorer Setup Guide

## Quick Start

This guide provides step-by-step instructions for setting up the NASA HWO Habitability Explorer on your local development environment or institutional servers.

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- **CPU**: 4 cores (Intel Core i5 or AMD Ryzen 5 equivalent)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 50GB available space
- **Network**: Broadband internet connection

### Recommended Development Environment
- **CPU**: 8+ cores with support for virtualization
- **RAM**: 16GB+ for optimal performance
- **Storage**: 100GB+ SSD storage
- **GPU**: Dedicated graphics card (optional, for 3D visualization)

### Required Software

**Core Dependencies:**
- **Docker Desktop**: 4.0+ (Windows/macOS) or Docker Engine 20.10+ (Linux)
- **Docker Compose**: v2.0+
- **Git**: Latest version for source code management
- **Node.js**: v18 LTS or later
- **Python**: 3.9+ (for data science components)

**Optional Development Tools:**
- **VS Code**: Recommended IDE with Docker and Python extensions
- **PostgreSQL Client**: pgAdmin, DBeaver, or psql command-line tool
- **Postman**: For API testing and development

## Installation Methods

### Method 1: Docker Compose (Recommended)

This is the fastest way to get the HWO Habitability Explorer running with all components.

#### Step 1: Clone the Repository

```bash
git clone https://github.com/nasa/hwo-habitability-explorer.git
cd hwo-habitability-explorer
```

#### Step 2: Environment Configuration

Create environment file:
```bash
cp .env.example .env
```

Edit `.env` with your preferences:
```bash
# Database Configuration
POSTGRES_USER=hwo_user
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=hwo_habitability

# Application Settings
SECRET_KEY=your-secret-key-at-least-32-characters-long
DEBUG=true
LOG_LEVEL=INFO

# API Configuration
API_HOST=localhost
API_PORT=8000
FRONTEND_PORT=3000

# External Data Sources
NASA_API_KEY=your_nasa_api_key_optional
JWST_DATA_ACCESS=true
TESS_DATA_INTEGRATION=true

# Machine Learning Configuration
ML_MODEL_PATH=./data_science/models/
USE_GPU_ACCELERATION=false
BATCH_SIZE=32
```

#### Step 3: Launch the Application

```bash
# Build and start all services
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

#### Step 4: Initialize the Database

```bash
# Run database migrations
docker-compose exec backend python -m alembic upgrade head

# Load sample data
docker-compose exec backend python scripts/load_sample_data.py
```

#### Step 5: Access the Application

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Database Admin**: http://localhost:8080 (if pgAdmin is enabled)

### Method 2: Local Development Setup

For developers who want to run components individually or make modifications to the codebase.

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
export DATABASE_URL="postgresql://hwo_user:password@localhost:5432/hwo_habitability"
export SECRET_KEY="your-secret-key-here"

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment configuration
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local

# Start development server
npm start
```

#### Database Setup (PostgreSQL)

**Using Docker:**
```bash
docker run --name hwo-postgres \
  -e POSTGRES_USER=hwo_user \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=hwo_habitability \
  -p 5432:5432 \
  -d postgres:13
```

**Native Installation:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib postgis

# macOS
brew install postgresql postgis

# Create database and user
sudo -u postgres createuser --interactive hwo_user
sudo -u postgres createdb -O hwo_user hwo_habitability

# Enable PostGIS extension
sudo -u postgres psql -d hwo_habitability -c "CREATE EXTENSION postgis;"
```

### Method 3: NASA Computing Environment

For deployment on NASA institutional computing infrastructure.

#### Prerequisites

- Access to NASA computing facilities
- Valid NASA credentials and security clearance
- Network access to NASA data repositories

#### Configuration for NASA Environment

Create `config/nasa_environment.yml`:

```yaml
# NASA-specific configuration
nasa_integration:
  exoplanet_archive:
    endpoint: "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
    authentication: "nasa_credentials"
  
  jwst_data:
    mast_endpoint: "https://mast.stsci.edu/api/v0.1/"
    data_access_level: "public"
    
  computing_resources:
    hpc_cluster: "pleiades.nas.nasa.gov"
    queue_system: "PBS Pro"
    max_nodes: 128
    walltime: "24:00:00"

security:
  authentication_method: "nasa_ldap"
  data_classification: "CUI"
  encryption_required: true
  
storage:
  shared_filesystem: "/nasa/hwo/data"
  scratch_space: "/nobackup/username"
  archive_location: "/nasa/hwo/archive"
```

#### NASA Deployment Script

Create `scripts/nasa_deploy.sh`:

```bash
#!/bin/bash
#PBS -N hwo-habitability-explorer
#PBS -q normal
#PBS -l select=4:ncpus=40:mpiprocs=40:model=sky_ele
#PBS -l walltime=8:00:00
#PBS -j oe
#PBS -m abe
#PBS -M your.email@nasa.gov

# Load required modules
module load python/3.9
module load postgresql/13
module load nodejs/18

# Set up environment
cd $PBS_O_WORKDIR
source venv/bin/activate

# Configure for NASA network
export DATABASE_URL="postgresql://hwo_user:$DB_PASSWORD@nasa-postgres:5432/hwo_db"
export NASA_NETWORK_CONFIG=true
export CORS_ORIGINS=["https://hwo.nasa.gov"]

# Start application
python -m gunicorn app.main:app --workers 8 --bind 0.0.0.0:8000
```

## Data Sources Configuration

### NASA Exoplanet Archive Integration

Configure automatic data synchronization with NASA's Exoplanet Archive:

```python
# config/data_sources.py
NASA_EXOPLANET_ARCHIVE = {
    'base_url': 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync',
    'query_endpoint': 'sync',
    'async_endpoint': 'async',
    'tables': {
        'confirmed_planets': 'ps',
        'composite_parameters': 'pscomppars',
        'toi_catalog': 'toi',
        'stellar_parameters': 'stellarhosts'
    },
    'update_frequency': 'daily',
    'batch_size': 1000
}

# Configure data ingestion
INGESTION_CONFIG = {
    'gaia_catalog': {
        'enabled': True,
        'data_release': 'DR3',
        'magnitude_limit': 12.0
    },
    'tess_data': {
        'enabled': True,
        'sectors': 'all',
        'quality_flags': 'strict'
    },
    'jwst_observations': {
        'enabled': True,
        'instruments': ['NIRSpec', 'MIRI', 'NIRCam'],
        'observation_modes': ['transit', 'eclipse']
    }
}
```

### Machine Learning Model Setup

Configure and download pre-trained habitability models:

```bash
# Download pre-trained models
curl -L "https://github.com/nasa/hwo-models/releases/latest/download/xgboost_habitability.pkl" \
  -o data_science/models/xgboost_habitability.pkl

curl -L "https://github.com/nasa/hwo-models/releases/latest/download/feature_scaler.pkl" \
  -o data_science/models/feature_scaler.pkl

# Verify model integrity
python scripts/verify_models.py
```

### External API Configuration

Set up connections to external astronomical databases:

```python
# config/external_apis.py
EXTERNAL_APIS = {
    'simbad': {
        'base_url': 'http://simbad.u-strasbg.fr/simbad/sim-tap/sync',
        'timeout': 30,
        'rate_limit': '10/minute'
    },
    'vizier': {
        'base_url': 'http://tapvizier.u-strasbg.fr/TAPVizieR/tap/sync',
        'catalogs': ['I/350', 'J/A+A/616/A1'],
        'timeout': 60
    },
    'gaia_archive': {
        'base_url': 'https://gea.esac.esa.int/tap-server/tap/sync',
        'table': 'gaiadr3.gaia_source',
        'timeout': 120
    }
}
```

## Development Environment Setup

### IDE Configuration (VS Code)

Install recommended extensions:

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.docker",
    "ms-python.autopep8",
    "ms-python.pylint",
    "esbenp.prettier-vscode",
    "ms-vscode.git-extension-pack",
    "ms-toolsai.jupyter"
  ]
}
```

Configure workspace settings in `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.testing.pytestEnabled": true,
  "python.testing.pytestArgs": ["backend/tests"],
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "editor.formatOnSave": true,
  "docker.showStartPage": false,
  "files.exclude": {
    "**/__pycache__": true,
    "**/node_modules": true,
    "**/.DS_Store": true
  }
}
```

### Git Configuration

Set up Git hooks for code quality:

```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
  
  - repo: https://github.com/psf/black
    rev: 23.1.0
    hooks:
      - id: black
        language_version: python3.9
  
  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
        args: ["--profile", "black"]
  
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.0.0-alpha.4
    hooks:
      - id: prettier
        files: \.(js|ts|jsx|tsx|css|md|json)$
EOF
```

## Testing Setup

### Backend Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov httpx

# Run tests with coverage
pytest backend/tests/ --cov=backend/app --cov-report=html

# Run specific test categories
pytest backend/tests/test_api.py -v
pytest backend/tests/test_models.py -v
pytest backend/tests/test_algorithms.py -v
```

### Frontend Testing

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false
```

### Integration Testing

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
python -m pytest tests/integration/ -v

# Cleanup
docker-compose -f docker-compose.test.yml down
```

## Performance Optimization

### Database Optimization

```sql
-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_exoplanets_habitability_score 
ON exoplanets (habitability_score DESC) 
WHERE habitability_score IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_exoplanets_stellar_params 
ON exoplanets (stellar_mass, stellar_radius, stellar_temperature);

CREATE INDEX CONCURRENTLY idx_exoplanets_orbital_params 
ON exoplanets (orbital_period, semi_major_axis, eccentricity);

-- Configure PostgreSQL for performance
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
SELECT pg_reload_conf();
```

### Application Performance

```python
# backend/app/config.py - Performance settings
class DevelopmentConfig:
    # Database connection pooling
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 3600,
        "pool_pre_ping": True
    }
    
    # Caching configuration
    CACHE_TYPE = "RedisCache"
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_KEY_PREFIX = "hwo:"
    
    # API performance
    CORS_ORIGINS = ["http://localhost:3000"]
    CORS_ALLOW_CREDENTIALS = True
    CORS_MAX_AGE = 600
```

## Troubleshooting Common Issues

### Docker Issues

**Problem**: Docker containers won't start
```bash
# Check Docker daemon status
docker info

# Check available disk space
df -h

# Restart Docker service
sudo systemctl restart docker

# Clean up Docker system
docker system prune -f
```

**Problem**: Port conflicts
```bash
# Check what's using the port
netstat -tlnp | grep :8000

# Kill process using the port
sudo fuser -k 8000/tcp

# Use different ports in docker-compose.yml
```

### Database Issues

**Problem**: Connection refused
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U hwo_user -d hwo_habitability
```

**Problem**: Migration errors
```bash
# Reset migrations
docker-compose exec backend alembic stamp head
docker-compose exec backend alembic upgrade head

# Check migration status
docker-compose exec backend alembic current
docker-compose exec backend alembic history
```

### Performance Issues

**Problem**: Slow API responses
```bash
# Check system resources
docker stats

# Analyze slow queries
docker-compose exec postgres psql -U hwo_user -d hwo_habitability -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Enable query logging
echo "log_statement = 'all'" >> postgresql.conf
```

### Frontend Issues

**Problem**: Build failures
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version compatibility
node --version
npm --version
```

## Next Steps

After successful setup:

1. **Explore the Data**: Visit the 3D galaxy map at http://localhost:3000
2. **Try the API**: Check out interactive documentation at http://localhost:8000/docs
3. **Load Your Data**: Use the data ingestion scripts to import custom datasets
4. **Customize Models**: Modify machine learning models in `data_science/algorithms/`
5. **Contribute**: Read the [contribution guide](../CONTRIBUTING.md) to participate in development

For additional help:
- Check the [FAQ](../FAQ.md)
- Review [API documentation](../api/)
- Join the NASA HWO community discussions
- Report issues on GitHub

## Security Considerations

### Development Security

- Never commit sensitive credentials to version control
- Use strong passwords for all database accounts
- Keep Docker and system packages updated
- Regularly scan containers for vulnerabilities

### Production Security

- Enable HTTPS with valid SSL certificates
- Configure firewall rules to restrict access
- Use secrets management for sensitive configuration
- Enable audit logging for database access
- Implement rate limiting and DDoS protection

For production deployment, see the detailed [Production Deployment Guide](./production_deployment.md).