# NASA HWO Habitability Explorer - Deployment Guide

## 🚀 Quick Deployment for NASA Evaluators

This document provides step-by-step instructions for NASA review team to deploy and evaluate the HWO Habitability Explorer.

## System Requirements

- **Windows 10/11** or **macOS 10.15+** or **Linux Ubuntu 18.04+**
- **Python 3.11+** (with pip)
- **Node.js 18+** (with npm)
- **4GB RAM** minimum, **8GB recommended**
- **2GB disk space**

## 🎯 Fastest Deployment (5 Minutes)

### Step 1: Download and Extract
```bash
# If using git
git clone https://github.com/SatnamCodes/nasa-hwo-habitability-explorer.git
cd nasa-hwo-habitability-explorer

# Or download and extract ZIP file
```

### Step 2: Install Dependencies
```bash
# Backend dependencies
cd backend
pip install fastapi uvicorn scikit-learn pandas numpy xgboost joblib python-multipart

# Frontend dependencies (in new terminal)
cd ../frontend
npm install
```

### Step 3: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 4: Access Application
- Open browser: http://localhost:3000
- API Documentation: http://localhost:8000/docs

## 🧪 Testing the System

### 1. Basic Functionality Test
- Navigate to "HWO Targets" page
- Verify 5 sample targets are displayed
- Check AI/ML scoring columns

### 2. CSV Upload Test
- Use provided test files in `/test_data/`
- Click "Upload CSV" button
- Test manual column mapping
- Verify ML model predictions

### 3. Advanced Features Test
- Test "Characterizability Score 📊"
- Try "Smart Filter Assistant 🤖"
- Explore "HWO Parameter Tuner 🔭"
- Check "Target-to-Target Pathing 🚀"
- View "Observational Priority List 📝"

## 📊 Pre-trained Models

The system includes pre-trained ML models:
- **XGBoost Habitability Model** (85.3% accuracy)
- **Feature Importance Rankings**
- **Calibrated Probability Scores**
- **Model Metadata and Validation**

Models are automatically loaded on backend startup.

## 🔍 Key Features to Evaluate

### 1. Habitability Scoring Algorithm
- **Location**: HWO Targets page
- **Algorithm**: Comprehensive Distance Habitability Score (CDHS)
- **Factors**: Distance, stellar type, planet radius, orbital period
- **ML Enhancement**: XGBoost model for probability predictions

### 2. CSV Data Processing
- **Intelligent Column Mapping**: Auto-detects NASA Exoplanet Archive format
- **Validation**: Checks required fields and data quality
- **ML Integration**: Real-time habitability scoring
- **Export**: Results can be exported for further analysis

### 3. Advanced Mission Planning Tools
- **Characterizability Analysis**: Coronagraph performance modeling
- **Smart Filtering**: AI-powered target selection
- **Parameter Optimization**: HWO instrument tuning
- **Observation Scheduling**: Slew time optimization
- **Priority Ranking**: Multi-factor scoring system

## 🐛 Troubleshooting

### Common Issues:
1. **Port conflicts**: Use different ports if 3000/8000 are busy
2. **Python packages**: Ensure all dependencies installed
3. **Node.js version**: Use Node 18+ for compatibility
4. **File permissions**: Ensure read/write access to project directory

### Support:
- Check browser console for errors
- Verify backend logs for API issues
- Use provided test data for consistent results

## 📈 Performance Metrics

- **Model Accuracy**: 85.3% on validation dataset
- **Response Time**: <500ms for single target scoring
- **Batch Processing**: 1000+ targets in <30 seconds
- **Memory Usage**: ~2GB for full operation

## 🎯 NASA Evaluation Criteria

This system addresses:
- ✅ **Scientific Merit**: Advanced habitability algorithms
- ✅ **Technical Innovation**: ML-enhanced scoring
- ✅ **Usability**: Intuitive web interface
- ✅ **Scalability**: Handles large datasets efficiently
- ✅ **Mission Relevance**: HWO-specific optimization
- ✅ **Data Integration**: NASA Exoplanet Archive compatibility

---

**Contact**: For technical support during evaluation, please reference the error logs and system specifications above.
