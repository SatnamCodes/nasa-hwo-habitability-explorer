<<<<<<< HEAD
# HWO Habitability Explorer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-blue.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

Comprehensive exoplanet habitability assessment platform for NASA's Habitable Worlds Observatory (HWO). Integrates multi-metric scoring algorithms, machine learning prediction, and observability optimization to prioritize life-detection targets. Built with modern web technologies for interactive exploration and mission planning.

## 🌟 Features

- **Advanced Habitability Scoring**: Comprehensive Distance Habitability Score (CDHS) algorithm
- **Planet Explorer**: Interactive database of 4,500+ confirmed exoplanets
- **HWO Target Dashboard**: Priority target identification and management
- **Mission Planner**: Observation strategy optimization and scheduling
- **Observation Simulator**: Data quality prediction and mission simulation
- **Machine Learning Models**: XGBoost-based habitability prediction
- **Real-time Analytics**: Live mission monitoring and progress tracking

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **Docker & Docker Compose** (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/hwo-habitability-explorer.git
   cd hwo-habitability-explorer
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API at http://localhost:8000
   - Frontend at http://localhost:3000
   - API documentation at http://localhost:8000/docs

### Docker Setup

1. **Build and start all services**
   ```bash
   npm run docker:build
   npm run docker:up
   ```

2. **View logs**
   ```bash
   npm run docker:logs
   ```

3. **Stop services**
   ```bash
   npm run docker:down
   ```

## 🏗️ Architecture

```
hwo-habitability-explorer/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── utils/          # Utility functions
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile         # Backend container
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── package.json        # Node dependencies
│   └── Dockerfile         # Frontend container
├── data_science/           # ML models & algorithms
│   ├── algorithms/         # Habitability algorithms
│   ├── models/             # Trained ML models
│   └── notebooks/          # Jupyter notebooks
├── data_pipeline/          # Data processing
│   ├── ingestion/          # Data sources
│   ├── processing/         # Data cleaning
│   └── database/           # Database migrations
└── docker-compose.yml      # Service orchestration
```

## 🔬 Core Algorithms

### Comprehensive Distance Habitability Score (CDHS)

The CDHS algorithm evaluates exoplanet habitability using multiple weighted factors:

- **Temperature Score (35%)**: Optimal range 273-373K (0-100°C)
- **Radius Score (25%)**: Optimal range 0.5-1.5 Earth radii
- **Stellar Flux Score (20%)**: Optimal range 0.5-2.0 Earth flux
- **Stability Score (20%)**: Orbital eccentricity and period optimization

### Machine Learning Models

- **XGBoost Classifier**: Habitability probability prediction
- **Feature Importance Analysis**: Key parameter identification
- **Cross-validation**: Robust model evaluation

## 📊 API Endpoints

### Planets
- `GET /api/v1/planets` - List all planets
- `GET /api/v1/planets/{id}` - Get planet details
- `GET /api/v1/planets/search` - Search planets by criteria

### Predictions
- `POST /api/v1/predictions/habitability` - Calculate habitability score
- `GET /api/v1/predictions/models` - Get available ML models

### HWO Targets
- `GET /api/v1/hwo-targets` - List priority targets
- `POST /api/v1/hwo-targets/prioritize` - Update target priorities

## 🎯 Mission Planning Features

- **Target Selection**: AI-powered candidate identification
- **Schedule Optimization**: Weather-aware observation planning
- **Resource Management**: Budget and time optimization
- **Real-time Monitoring**: Live mission status updates

## 🧪 Development

### Running Tests
```bash
# All tests
npm test

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend
```

### Code Quality
```bash
# Linting
npm run lint

# Formatting
npm run format
```

### Database Migrations
```bash
cd backend
alembic upgrade head
```

## 📈 Performance

- **API Response Time**: < 100ms average
- **Database Queries**: Optimized with indexes and caching
- **Frontend Load Time**: < 2s initial load
- **Real-time Updates**: WebSocket support for live data

## 🔒 Security

- **CORS Configuration**: Restricted origin access
- **Input Validation**: Pydantic schema validation
- **SQL Injection Protection**: SQLAlchemy ORM
- **Rate Limiting**: API request throttling

## 🌍 Deployment

### Production Environment
```bash
# Build production images
npm run docker:build

# Deploy with environment variables
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment
```bash
kubectl apply -f deployment/kubernetes/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for frontend components
- Write comprehensive tests for new features
- Update documentation for API changes

## 📚 Documentation

- [API Documentation](http://localhost:8000/docs) - Interactive API docs
- [Algorithm Details](docs/algorithms/) - Scientific methodology
- [Deployment Guide](docs/deployment/) - Production setup
- [User Manual](docs/user-manual/) - End-user documentation

## 🏆 Acknowledgments

- **NASA HWO Mission Team** - Scientific guidance and requirements
- **Exoplanet Archive** - Data sources and validation
- **Scientific Community** - Algorithm development and peer review

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/hwo-habitability-explorer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/hwo-habitability-explorer/discussions)
- **Email**: support@hwo-explorer.org

---

**Built with ❤️ for the advancement of exoplanet science and the search for habitable worlds.**
=======
# hwo-habitability-explorer
>>>>>>> b2265f0c5f3dfbe98d91c08a9d283d6ff722b373
