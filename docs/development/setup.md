# Development Setup Guide

## Prerequisites

### System Requirements

**Operating System:**
- Windows 10/11 (Recommended)
- macOS 10.15+
- Ubuntu 18.04+ / Debian 9+

**Hardware Requirements:**
- 8GB RAM minimum (16GB recommended)
- 10GB free disk space
- Multi-core processor (4+ cores recommended)
- Dedicated GPU (optional, for 3D visualization development)

**Required Software:**
- **Node.js**: Version 18.0+ ([Download](https://nodejs.org/))
- **Python**: Version 3.11+ ([Download](https://www.python.org/downloads/))
- **Git**: Latest version ([Download](https://git-scm.com/downloads))
- **VS Code**: Recommended IDE ([Download](https://code.visualstudio.com/))

## Initial Setup

### 1. Clone the Repository

```bash
# HTTPS
git clone https://github.com/SatnamCodes/nasa-hwo-habitability-explorer.git
cd nasa-hwo-habitability-explorer

# SSH (if configured)
git clone git@github.com:SatnamCodes/nasa-hwo-habitability-explorer.git
cd nasa-hwo-habitability-explorer
```

### 2. Environment Setup

**Create Environment Files:**
```bash
# Root directory
cp .env.example .env

# Frontend directory
cp frontend/.env.example frontend/.env

# Backend directory
cp backend/.env.example backend/.env
```

**Configure Environment Variables:**

**Root `.env`:**
```bash
# Application Settings
NODE_ENV=development
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_VERSION=1.0.0

# Development Settings
DEBUG_MODE=true
LOG_LEVEL=debug
```

**Backend `.env`:**
```bash
# Database
DATABASE_URL=sqlite:///./exoplanets.db
DATABASE_ECHO=false

# API Settings
SECRET_KEY=your-development-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60

# File Upload
MAX_UPLOAD_SIZE=104857600  # 100MB
UPLOAD_DIRECTORY=./uploads

# ML Models
MODEL_DIRECTORY=../data_science/models
ENABLE_ML_FEATURES=true

# Development
DEBUG=true
RELOAD=true
```

**Frontend `.env`:**
```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000

# Feature Flags
REACT_APP_ENABLE_3D_MAP=true
REACT_APP_ENABLE_AI_FEATURES=true
REACT_APP_ENABLE_ANALYTICS=false

# Development
REACT_APP_DEBUG_MODE=true
GENERATE_SOURCEMAP=true
```

### 3. Install Dependencies

**Install All Dependencies (Recommended):**
```bash
npm run install:all
```

**Or Install Manually:**

**Root Dependencies:**
```bash
npm install
```

**Frontend Dependencies:**
```bash
cd frontend
npm install
cd ..
```

**Backend Dependencies:**
```bash
cd backend
pip install -r requirements.txt
# Or using virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 4. Database Setup

**Initialize Database:**
```bash
cd backend
python -c "from app.database import create_tables; create_tables()"
cd ..
```

**Load Sample Data (Optional):**
```bash
cd data_science/datasets
python sample.py
cd ../..
```

### 5. ML Models Setup

**Download Pre-trained Models:**
```bash
# Models should be in data_science/models/
# If missing, run the training pipeline:
cd data_science/notebooks
jupyter notebook 03_ml_model_development.ipynb
cd ../..
```

**Verify Model Files:**
```bash
ls -la data_science/models/
# Should contain:
# - xgboost_habitability.pkl
# - feature_scaler.pkl
# - feature_importance.pkl
# - model_metadata.json
```

## Development Workflow

### 1. Starting Development Servers

**Option A: Concurrent Start (Recommended)**
```bash
# Start both frontend and backend simultaneously
npm run dev

# For NASA evaluation specifically
npm run nasa:deploy
```

**Option B: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm start
```

### 2. Accessing the Application

**Frontend:** http://localhost:3000 or http://localhost:3001  
**Backend API:** http://localhost:8000  
**API Documentation:** http://localhost:8000/docs  
**Alternative API Docs:** http://localhost:8000/redoc  

### 3. Development Tools

**VS Code Extensions (Recommended):**
```json
{
    "recommendations": [
        "ms-python.python",
        "ms-python.pylint",
        "ms-python.black-formatter",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next",
        "ms-vscode.vscode-json",
        "ms-python.isort",
        "ms-toolsai.jupyter"
    ]
}
```

**Python Development Setup:**
```bash
# Install development tools
pip install black flake8 pytest pytest-asyncio pytest-cov

# Configure pre-commit hooks
pip install pre-commit
pre-commit install
```

**Frontend Development Setup:**
```bash
# Install development tools
cd frontend
npm install --save-dev @types/react @types/node prettier eslint

# Configure linting
npm run lint
cd ..
```

## Project Structure Explained

```
nasa-hwo-habitability-explorer/
├── 📁 backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   ├── models/            # Database models
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utility functions
│   ├── requirements.txt       # Python dependencies
│   └── tests/                 # Backend tests
├── 📁 frontend/               # React TypeScript frontend
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Route components
│   │   ├── services/          # API communication
│   │   ├── types/             # TypeScript definitions
│   │   └── utils/             # Helper functions
│   ├── package.json           # Node.js dependencies
│   └── build/                 # Production build output
├── 📁 data_science/           # ML models and algorithms
│   ├── algorithms/            # Habitability scoring algorithms
│   ├── datasets/              # Raw and processed data
│   ├── models/                # Trained ML models
│   └── notebooks/             # Jupyter analysis notebooks
├── 📁 data_pipeline/          # Data processing pipeline
│   ├── ingestion/             # Data source connectors
│   ├── processing/            # Data transformation
│   └── database/              # Database utilities
├── 📁 docs/                   # Documentation
│   ├── api/                   # API documentation
│   ├── architecture/          # System architecture
│   ├── deployment/            # Deployment guides
│   └── features/              # Feature documentation
├── 📁 tests/                  # Integration tests
├── 📁 deployment/             # Docker and deployment configs
├── docker-compose.yml         # Docker orchestration
├── package.json               # Root package configuration
└── README.md                  # Project overview
```

## Development Commands

### Root Level Commands

```bash
# Development
npm run dev                    # Start both frontend and backend
npm run nasa:deploy           # NASA evaluation mode

# Installation
npm run install:all           # Install all dependencies

# Testing
npm run test                  # Run all tests
npm run test:backend          # Backend tests only
npm run test:frontend         # Frontend tests only

# Linting and Formatting
npm run lint                  # Lint all code
npm run format                # Format all code

# Docker
npm run docker:build          # Build Docker images
npm run docker:up             # Start Docker containers
npm run docker:down           # Stop Docker containers
```

### Backend Commands

```bash
cd backend

# Development
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Testing
python -m pytest              # Run tests
python -m pytest --cov        # Run tests with coverage
python -m pytest -v           # Verbose test output

# Code Quality
black .                       # Format code
flake8 .                      # Lint code
isort .                       # Sort imports

# Database
python -c "from app.database import create_tables; create_tables()"

# ML Model Management
python scripts/train_models.py      # Train ML models
python scripts/evaluate_models.py   # Evaluate model performance
```

### Frontend Commands

```bash
cd frontend

# Development
npm start                     # Start development server
npm run build                 # Production build
npm test                      # Run tests
npm run test:watch            # Watch mode tests

# Code Quality
npm run lint                  # ESLint
npm run lint:fix              # Fix ESLint issues
npm run format                # Prettier formatting

# Bundle Analysis
npm run analyze               # Analyze bundle size
```

## Debugging and Development Tips

### 1. Backend Debugging

**VS Code Debug Configuration (`.vscode/launch.json`):**
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: FastAPI",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/backend/app/main.py",
            "console": "integratedTerminal",
            "env": {
                "DEBUG": "true",
                "PYTHONPATH": "${workspaceFolder}/backend"
            },
            "args": ["--reload", "--host", "0.0.0.0", "--port", "8000"]
        }
    ]
}
```

**Logging Configuration:**
```python
# backend/app/utils/logger.py
import logging
import sys

def setup_logger():
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('app.log')
        ]
    )
    return logging.getLogger(__name__)
```

### 2. Frontend Debugging

**Browser DevTools:**
- **React Developer Tools** extension
- **Redux DevTools** (if using Redux)
- Network tab for API debugging
- Console for JavaScript errors

**VS Code Debug Configuration:**
```json
{
    "name": "Debug React",
    "type": "node",
    "request": "attach",
    "port": 9229,
    "webRoot": "${workspaceFolder}/frontend/src"
}
```

### 3. Common Development Issues

**Port Already in Use:**
```bash
# Find process using port
netstat -ano | findstr :3000    # Windows
lsof -ti:3000                   # macOS/Linux

# Kill process
taskkill /PID <PID> /F          # Windows
kill -9 <PID>                   # macOS/Linux
```

**Python Environment Issues:**
```bash
# Verify Python path
which python
python --version

# Virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Package conflicts
pip freeze > requirements_current.txt
pip uninstall -r requirements_current.txt -y
pip install -r requirements.txt
```

**Node.js/npm Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json    # macOS/Linux
rmdir /s node_modules & del package-lock.json  # Windows
npm install

# Check Node version
node --version
npm --version
```

### 4. Hot Reload Configuration

**Backend Hot Reload:**
- Uvicorn `--reload` flag automatically enabled in development
- Watches for file changes in the `app/` directory
- Restarts server when Python files are modified

**Frontend Hot Reload:**
- React's built-in hot module replacement (HMR)
- Automatic browser refresh on file changes
- Preserves component state when possible

## Testing Environment

### 1. Unit Testing Setup

**Backend Testing:**
```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def sample_planet_data():
    return {
        "pl_name": "Test Planet b",
        "pl_rade": 1.2,
        "pl_bmasse": 1.5,
        "st_teff": 5778
    }
```

**Frontend Testing:**
```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';

// Mock API calls
global.fetch = jest.fn();

// Mock Three.js for tests
jest.mock('three', () => ({
    Scene: jest.fn(() => ({})),
    PerspectiveCamera: jest.fn(() => ({})),
    WebGLRenderer: jest.fn(() => ({}))
}));
```

### 2. Test Data Management

**Sample Data Generation:**
```python
# tests/utils/test_data.py
def generate_test_planets(count: int = 10):
    """Generate test planet data"""
    planets = []
    for i in range(count):
        planets.append({
            "pl_name": f"Test Planet {i}",
            "pl_rade": random.uniform(0.5, 2.0),
            "pl_bmasse": random.uniform(0.1, 5.0),
            "st_teff": random.uniform(3000, 7000),
            "st_dist": random.uniform(5, 100)
        })
    return planets
```

## Production Readiness Checklist

- [ ] **Environment Variables**: All sensitive data in environment files
- [ ] **Security**: CORS properly configured, input validation implemented
- [ ] **Performance**: Database queries optimized, caching implemented
- [ ] **Error Handling**: Comprehensive error handling and logging
- [ ] **Testing**: Unit tests passing, integration tests implemented
- [ ] **Documentation**: API documentation up-to-date
- [ ] **Monitoring**: Health checks and monitoring endpoints implemented
- [ ] **Build Process**: Production builds optimized
- [ ] **Database**: Production database configured and migrated

This development setup provides a comprehensive foundation for contributing to the NASA HWO Habitability Explorer project while maintaining code quality and development efficiency.
