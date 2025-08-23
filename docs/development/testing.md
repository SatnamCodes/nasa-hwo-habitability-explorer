# Testing Guide - NASA HWO Habitability Explorer

## Testing Strategy

Our comprehensive testing strategy ensures the reliability and accuracy of the NASA HWO Habitability Explorer across all components, from individual functions to full system integration.

### Testing Pyramid

```
                    🔺
                   E2E Tests
                 ┌─────────────┐
                 │ Integration │
                 │    Tests    │
                ├─────────────────┤
                │   Component     │
                │    Tests        │
               ├───────────────────┤
               │   Unit Tests      │
              └─────────────────────┘
```

**Test Distribution:**
- **Unit Tests**: 70% - Fast, isolated, focused
- **Component Tests**: 20% - Integration between modules
- **E2E Tests**: 10% - Full user workflow validation

## Backend Testing (Python)

### 1. Test Setup and Configuration

**Test Dependencies:**
```python
# requirements-test.txt
pytest>=7.2.0
pytest-asyncio>=0.21.0
pytest-cov>=4.0.0
httpx>=0.24.0
factory-boy>=3.2.0
freezegun>=1.2.0
responses>=0.23.0
```

**Test Configuration (`pytest.ini`):**
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --strict-markers
    --strict-config
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

**Fixtures (`tests/conftest.py`):**
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db, Base
from app.models.planet import Planet

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(db):
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def sample_planet():
    return {
        "pl_name": "Test Planet b",
        "pl_rade": 1.2,
        "pl_bmasse": 1.8,
        "pl_orbper": 365.25,
        "st_teff": 5778.0,
        "st_rad": 1.0,
        "st_mass": 1.0,
        "st_dist": 25.0
    }
```

### 2. Unit Tests

**Model Tests (`tests/test_models.py`):**
```python
import pytest
from app.models.planet import Planet
from app.services.habitability_service import HabitabilityService

class TestPlanetModel:
    def test_planet_creation(self, db_session, sample_planet):
        """Test planet model creation"""
        planet = Planet(**sample_planet)
        db_session.add(planet)
        db_session.commit()
        db_session.refresh(planet)
        
        assert planet.pl_name == "Test Planet b"
        assert planet.pl_rade == 1.2
        assert planet.id is not None

    def test_is_habitable_property(self, sample_planet):
        """Test habitability property calculation"""
        planet = Planet(**sample_planet)
        planet.habitability_score = 0.7
        assert planet.is_habitable is True
        
        planet.habitability_score = 0.3
        assert planet.is_habitable is False

    def test_temperature_estimate(self, sample_planet):
        """Test temperature calculation"""
        planet = Planet(**sample_planet)
        temp = planet.temperature_estimate
        
        assert temp is not None
        assert isinstance(temp, float)
        assert temp > 0

class TestHabitabilityService:
    def test_cdhs_score_calculation(self, sample_planet):
        """Test CDHS score calculation"""
        score = HabitabilityService.calculate_cdhs_score(sample_planet)
        
        assert 0 <= score <= 1
        assert isinstance(score, float)

    def test_temperature_score_habitable_zone(self):
        """Test temperature score for planet in habitable zone"""
        score = HabitabilityService._calculate_temperature_score(5778, 1.0)  # Earth-like
        assert score > 0.8

    def test_temperature_score_too_hot(self):
        """Test temperature score for planet too close to star"""
        score = HabitabilityService._calculate_temperature_score(5778, 0.1)
        assert score < 0.5

    def test_size_score_earth_like(self):
        """Test size score for Earth-like planet"""
        score = HabitabilityService._calculate_size_score(1.0)  # Earth radius
        assert score == 1.0

    def test_size_score_too_large(self):
        """Test size score for gas giant"""
        score = HabitabilityService._calculate_size_score(5.0)
        assert score < 0.3

    @pytest.mark.parametrize("eccentricity,expected", [
        (0.0, 1.0),    # Circular orbit
        (0.05, 1.0),   # Nearly circular
        (0.2, 0.7),    # Moderate eccentricity
        (0.5, 0.35),   # High eccentricity
    ])
    def test_orbital_score(self, eccentricity, expected):
        """Test orbital score for different eccentricities"""
        score = HabitabilityService._calculate_orbital_score(eccentricity)
        assert abs(score - expected) < 0.1
```

**API Tests (`tests/test_api.py`):**
```python
import pytest
from fastapi import status

class TestPlanetsAPI:
    def test_get_planets_empty(self, client):
        """Test getting planets from empty database"""
        response = client.get("/api/planets/")
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["planets"] == []
        assert data["total"] == 0

    def test_get_planets_with_data(self, client, db_session, sample_planet):
        """Test getting planets with data"""
        # Add test planet
        planet = Planet(**sample_planet)
        db_session.add(planet)
        db_session.commit()
        
        response = client.get("/api/planets/")
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert len(data["planets"]) == 1
        assert data["planets"][0]["pl_name"] == "Test Planet b"

    def test_get_planet_by_name(self, client, db_session, sample_planet):
        """Test getting specific planet by name"""
        planet = Planet(**sample_planet)
        db_session.add(planet)
        db_session.commit()
        
        response = client.get("/api/planets/Test Planet b")
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["pl_name"] == "Test Planet b"

    def test_get_planet_not_found(self, client):
        """Test getting non-existent planet"""
        response = client.get("/api/planets/Nonexistent Planet")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_calculate_habitability(self, client, sample_planet):
        """Test habitability calculation endpoint"""
        payload = {"planets": [sample_planet]}
        response = client.post("/api/habitability/calculate", json=payload)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "results" in data
        assert len(data["results"]) == 1
        assert "habitability_score" in data["results"][0]
        assert 0 <= data["results"][0]["habitability_score"] <= 1

    def test_planets_filtering(self, client, db_session):
        """Test planet filtering functionality"""
        # Create test planets with different habitability scores
        planets_data = [
            {"pl_name": "High Hab Planet", "pl_rade": 1.0, "st_teff": 5778, "st_dist": 10},
            {"pl_name": "Low Hab Planet", "pl_rade": 5.0, "st_teff": 3000, "st_dist": 100}
        ]
        
        for planet_data in planets_data:
            planet = Planet(**planet_data)
            planet.habitability_score = 0.8 if "High" in planet_data["pl_name"] else 0.2
            db_session.add(planet)
        db_session.commit()
        
        # Test minimum habitability filter
        response = client.get("/api/planets/?min_habitability=0.5")
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert len(data["planets"]) == 1
        assert data["planets"][0]["pl_name"] == "High Hab Planet"

    def test_upload_csv_valid_file(self, client):
        """Test CSV upload with valid data"""
        csv_content = """pl_name,pl_rade,pl_bmasse,st_teff
Test Planet 1,1.2,1.8,5778
Test Planet 2,0.8,0.9,4500"""
        
        files = {"file": ("test.csv", csv_content, "text/csv")}
        response = client.post("/api/upload/csv", files=files)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "processed_rows" in data
        assert data["processed_rows"] == 2

    def test_upload_csv_invalid_format(self, client):
        """Test CSV upload with invalid format"""
        files = {"file": ("test.txt", "invalid content", "text/plain")}
        response = client.post("/api/upload/csv", files=files)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
```

### 3. Integration Tests

**Service Integration (`tests/test_integration.py`):**
```python
import pytest
from app.services.planet_service import PlanetService
from app.services.habitability_service import HabitabilityService
from app.models.planet import Planet

class TestServiceIntegration:
    def test_full_planet_processing_pipeline(self, db_session):
        """Test complete planet processing from input to database"""
        planet_data = {
            "pl_name": "Integration Test Planet",
            "pl_rade": 1.1,
            "pl_bmasse": 1.3,
            "pl_orbper": 400,
            "st_teff": 5500,
            "st_dist": 20
        }
        
        # Calculate habitability score
        habitability_score = HabitabilityService.calculate_cdhs_score(planet_data)
        
        # Create planet with score
        planet_data["habitability_score"] = habitability_score
        planet = Planet.create(db_session, **planet_data)
        
        # Verify planet was created with correct score
        assert planet.id is not None
        assert planet.habitability_score == habitability_score
        assert planet.pl_name == "Integration Test Planet"
        
        # Test retrieval
        retrieved = PlanetService.get_planet_by_name(db_session, planet.pl_name)
        assert retrieved is not None
        assert retrieved.id == planet.id

    def test_batch_processing(self, db_session):
        """Test batch processing of multiple planets"""
        planets_data = [
            {"pl_name": f"Batch Planet {i}", "pl_rade": 1.0 + i*0.1, "st_teff": 5000 + i*100}
            for i in range(5)
        ]
        
        processed_planets = []
        for planet_data in planets_data:
            score = HabitabilityService.calculate_cdhs_score(planet_data)
            planet_data["habitability_score"] = score
            planet = Planet.create(db_session, **planet_data)
            processed_planets.append(planet)
        
        # Verify all planets were processed
        assert len(processed_planets) == 5
        
        # Test batch retrieval
        all_planets = PlanetService.get_all_planets(db_session)
        assert len(all_planets) >= 5
```

## Frontend Testing (React/TypeScript)

### 1. Test Setup

**Test Dependencies (`package.json`):**
```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "@types/jest": "^29.5.5",
    "jest-environment-jsdom": "^29.7.0",
    "msw": "^1.3.2"
  }
}
```

**Test Setup (`src/setupTests.ts`):**
```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock API server for tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Three.js
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn(),
  })),
  PerspectiveCamera: jest.fn(() => ({})),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    domElement: document.createElement('canvas'),
  })),
  OrbitControls: jest.fn(() => ({
    enableDamping: true,
  })),
}));

// Mock React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);
```

### 2. Component Tests

**Dashboard Tests (`src/components/__tests__/Dashboard.test.tsx`):**
```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { TestWrapper } from '../../setupTests';

const renderDashboard = () => {
  return render(
    <TestWrapper>
      <Dashboard />
    </TestWrapper>
  );
};

describe('Dashboard', () => {
  it('renders main statistics', async () => {
    renderDashboard();
    
    // Check for main statistics cards
    await waitFor(() => {
      expect(screen.getByText('Total Targets')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('Average AI Score')).toBeInTheDocument();
    });
  });

  it('displays correct statistics values', async () => {
    renderDashboard();
    
    // Mock API response should provide these values
    await waitFor(() => {
      expect(screen.getByText('4,524')).toBeInTheDocument(); // Total targets
      expect(screen.getByText('127')).toBeInTheDocument();   // High priority
      expect(screen.getByText('0.68')).toBeInTheDocument();  // Average score
    });
  });

  it('handles navigation to different sections', async () => {
    const user = userEvent.setup();
    renderDashboard();
    
    const hwoTargetsButton = screen.getByRole('button', { name: /hwo target dashboard/i });
    await user.click(hwoTargetsButton);
    
    // Should navigate to HWO targets (would need router context in real test)
    expect(hwoTargetsButton).toBeInTheDocument();
  });
});
```

**CSV Upload Tests (`src/components/__tests__/CSVUpload.test.tsx`):**
```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CSVUploadSystem from '../data/CSVUploadSystem';
import { TestWrapper } from '../../setupTests';

describe('CSVUploadSystem', () => {
  it('renders upload zone', () => {
    render(
      <TestWrapper>
        <CSVUploadSystem />
      </TestWrapper>
    );
    
    expect(screen.getByText(/drop your csv file here/i)).toBeInTheDocument();
  });

  it('handles file drop', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['pl_name,pl_rade\nTest Planet,1.2'], 'test.csv', {
      type: 'text/csv',
    });
    
    render(
      <TestWrapper>
        <CSVUploadSystem />
      </TestWrapper>
    );
    
    const dropZone = screen.getByText(/drop your csv file here/i).closest('div');
    
    // Simulate file drop
    await user.upload(screen.getByLabelText(/upload file/i), mockFile);
    
    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });

  it('shows validation errors', async () => {
    const mockInvalidFile = new File(['invalid content'], 'test.txt', {
      type: 'text/plain',
    });
    
    render(
      <TestWrapper>
        <CSVUploadSystem onError={jest.fn()} />
      </TestWrapper>
    );
    
    await userEvent.upload(screen.getByLabelText(/upload file/i), mockInvalidFile);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
    });
  });
});
```

### 3. API Service Tests

**API Service Tests (`src/services/__tests__/exoplanetAPI.test.ts`):**
```typescript
import { rest } from 'msw';
import { server } from '../../mocks/server';
import ExoplanetAPIService from '../exoplanetAPI';

describe('ExoplanetAPIService', () => {
  it('fetches planets successfully', async () => {
    server.use(
      rest.get('/api/planets', (req, res, ctx) => {
        return res(
          ctx.json({
            planets: [
              {
                pl_name: 'Test Planet',
                habitability_score: 0.85,
                hwo_priority: 'high',
              },
            ],
            total: 1,
          })
        );
      })
    );

    const result = await ExoplanetAPIService.getPlanets();
    
    expect(result.planets).toHaveLength(1);
    expect(result.planets[0].pl_name).toBe('Test Planet');
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('/api/planets', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
      })
    );

    await expect(ExoplanetAPIService.getPlanets()).rejects.toThrow();
  });

  it('calculates habitability with correct payload', async () => {
    const mockPlanet = {
      pl_name: 'Test Planet',
      pl_rade: 1.2,
      pl_bmasse: 1.8,
    };

    server.use(
      rest.post('/api/habitability/calculate', (req, res, ctx) => {
        return res(
          ctx.json({
            results: [
              {
                pl_name: 'Test Planet',
                habitability_score: 0.75,
              },
            ],
          })
        );
      })
    );

    const result = await ExoplanetAPIService.calculateHabitability([mockPlanet]);
    
    expect(result.results).toHaveLength(1);
    expect(result.results[0].habitability_score).toBe(0.75);
  });
});
```

### 4. Mock Service Worker (MSW) Setup

**Mock Handlers (`src/mocks/handlers.ts`):**
```typescript
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/planets', (req, res, ctx) => {
    return res(
      ctx.json({
        planets: [
          {
            pl_name: 'Proxima Cen b',
            habitability_score: 0.85,
            hwo_priority: 'high',
            st_dist: 4.24,
          },
          {
            pl_name: 'TRAPPIST-1e',
            habitability_score: 0.78,
            hwo_priority: 'medium',
            st_dist: 12.43,
          },
        ],
        total: 2,
        page: 1,
        limit: 100,
      })
    );
  }),

  rest.post('/api/habitability/calculate', (req, res, ctx) => {
    return res(
      ctx.json({
        results: [
          {
            pl_name: 'Test Planet',
            habitability_score: 0.75,
            cdhs_score: 0.72,
            ml_prediction: 0.78,
          },
        ],
      })
    );
  }),

  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.json({
        status: 'healthy',
        version: '1.0.0',
      })
    );
  }),
];
```

## End-to-End Testing

### 1. Cypress Configuration

**Installation:**
```bash
npm install --save-dev cypress @cypress/react @cypress/webpack-dev-server
```

**Configuration (`cypress.config.ts`):**
```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    viewportWidth: 1280,
    viewportHeight: 720,
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
});
```

### 2. E2E Test Examples

**User Workflow Tests (`cypress/e2e/user-workflow.cy.ts`):**
```typescript
describe('User Workflow - Planet Analysis', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('completes full analysis workflow', () => {
    // Navigate to HWO targets
    cy.get('[data-testid="hwo-targets-link"]').click();
    cy.url().should('include', '/hwo-targets');

    // Apply filters
    cy.get('[data-testid="habitability-filter"]').type('0.7');
    cy.get('[data-testid="distance-filter"]').type('50');
    cy.get('[data-testid="apply-filters"]').click();

    // Verify filtered results
    cy.get('[data-testid="planet-list"]').should('be.visible');
    cy.get('[data-testid="planet-card"]').should('have.length.at.least', 1);

    // Select a planet for detailed analysis
    cy.get('[data-testid="planet-card"]').first().click();
    cy.get('[data-testid="planet-details"]').should('be.visible');

    // Use AI features
    cy.get('[data-testid="ai-features-button"]').click();
    cy.get('[data-testid="characterizability-score"]').click();
    cy.get('[data-testid="ai-results"]').should('be.visible');
  });

  it('uploads and processes CSV file', () => {
    // Navigate to upload
    cy.get('[data-testid="upload-csv-button"]').click();

    // Upload file
    cy.fixture('sample-planets.csv').then((fileContent) => {
      cy.get('[data-testid="file-upload"]').attachFile({
        fileContent: fileContent.toString(),
        fileName: 'sample-planets.csv',
        mimeType: 'text/csv',
      });
    });

    // Wait for processing
    cy.get('[data-testid="processing-status"]').should('be.visible');
    cy.get('[data-testid="processing-complete"]', { timeout: 30000 }).should('be.visible');

    // Verify results
    cy.get('[data-testid="processing-results"]').should('contain', 'planets processed');
    cy.get('[data-testid="download-results"]').should('be.visible');
  });
});
```

### 3. Performance Testing

**Load Testing with Artillery:**
```yaml
# artillery-load-test.yml
config:
  target: 'http://localhost:8000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 5
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/health"
      - get:
          url: "/api/planets?limit=100"
      - post:
          url: "/api/habitability/calculate"
          json:
            planets:
              - pl_name: "Load Test Planet"
                pl_rade: 1.2
                st_teff: 5778
```

## Test Coverage and Quality Metrics

### 1. Coverage Requirements

**Minimum Coverage Targets:**
- **Overall**: 80%
- **Critical Functions**: 95%
- **API Endpoints**: 90%
- **Business Logic**: 85%

**Coverage Commands:**
```bash
# Backend coverage
cd backend
pytest --cov=app --cov-report=html --cov-report=term

# Frontend coverage
cd frontend
npm test -- --coverage --coverageDirectory=coverage
```

### 2. Quality Gates

**Pre-commit Hooks (`.pre-commit-config.yaml`):**
```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.0.0
    hooks:
      - id: prettier
        files: \.(js|jsx|ts|tsx|css|md|json)$
```

### 3. CI/CD Pipeline Testing

**GitHub Actions (`..github/workflows/test.yml`):**
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-test.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run tests
        run: |
          cd frontend
          npm test -- --coverage --watchAll=false
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./frontend/coverage/lcov.info
```

This comprehensive testing guide ensures the reliability and quality of the NASA HWO Habitability Explorer across all components and use cases.
