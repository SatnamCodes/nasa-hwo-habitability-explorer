# Frontend Architecture Documentation

## React/TypeScript Frontend Implementation

The frontend of the NASA HWO Habitability Explorer is built using modern React 18 with TypeScript, providing a robust and type-safe user interface for exoplanet analysis and mission planning.

## Architecture Overview

```
Frontend Application
├── Public Assets
│   ├── index.html (SPA entry point)
│   ├── manifest.json (PWA config)
│   └── favicon.ico
├── Source Code (/src)
│   ├── components/ (Reusable UI components)
│   ├── pages/ (Route-level components)
│   ├── services/ (API communication)
│   ├── hooks/ (Custom React hooks)
│   ├── types/ (TypeScript definitions)
│   ├── utils/ (Helper functions)
│   └── styles/ (Global styles)
├── Build Pipeline
│   ├── Create React App
│   ├── TypeScript Compiler
│   ├── Webpack Bundler
│   └── Development Server
└── Production Build
    ├── Static Assets
    ├── Chunked JavaScript
    └── Optimized CSS
```

## Component Architecture

### Component Hierarchy

```typescript
App (Router Root)
├── Header (Navigation)
├── Main Content
│   ├── Dashboard (/)
│   │   ├── StatisticsPanel
│   │   ├── QuickActions
│   │   └── RecentActivity
│   ├── HWO Targets (/hwo-targets)
│   │   ├── TargetDashboard
│   │   ├── FilterControls
│   │   ├── TargetList
│   │   └── TargetDetails
│   ├── Galaxy Map (/galaxy-map)
│   │   ├── GalaxyMapPage
│   │   ├── ThreeJSVisualization
│   │   ├── ControlPanel
│   │   └── InfoPanel
│   ├── Planet Explorer (/planets)
│   │   ├── PlanetExplorer
│   │   ├── SearchFilters
│   │   ├── DataGrid
│   │   └── PlanetDetails
│   └── Privacy Policy (/privacy)
│       └── PrivacyPage
└── Footer (Links and info)
```

### Core Components

#### 1. Layout Components

**Header Component** (`components/common/Header.tsx`)
```typescript
interface HeaderProps {
  user?: User;
  onNavigate?: (path: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onNavigate }) => {
  // Navigation bar with logo, menu items, and user controls
  // Responsive design for mobile/desktop
  // Material-UI AppBar with custom styling
};
```

**Footer Component** (`components/common/Footer.tsx`)
```typescript
const Footer: React.FC = () => {
  // Links to documentation, GitHub, NASA resources
  // Privacy policy and legal information
  // Version and build information
};
```

#### 2. Dashboard Components

**Dashboard** (`pages/Dashboard.tsx`)
```typescript
interface DashboardState {
  statistics: SystemStatistics;
  recentActivity: ActivityItem[];
  quickActions: ActionItem[];
}

const Dashboard: React.FC = () => {
  // Main application dashboard
  // Real-time statistics display
  // Quick action buttons
  // Recent activity feed
};
```

**StatisticsPanel** (`components/dashboard/StatisticsPanel.tsx`)
```typescript
interface StatisticsPanelProps {
  totalTargets: number;
  highPriority: number;
  averageAIScore: number;
  filteredResults: number;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = (props) => {
  // Grid of key metrics cards
  // Real-time data synchronization
  // Visual indicators and trends
};
```

#### 3. HWO Target Components

**TargetDashboard** (`components/hwo/TargetDashboard.tsx`)
```typescript
interface TargetDashboardProps {
  onFilterChange?: (filters: TargetFilters) => void;
  onTargetSelect?: (target: ExoplanetTarget) => void;
}

const TargetDashboard: React.FC<TargetDashboardProps> = (props) => {
  // Main HWO target analysis interface
  // Filter controls and target list
  // Priority scoring display
  // Advanced AI features integration
};
```

**AdvancedAIFeatures** (`components/hwo/AdvancedAIFeatures.tsx`)
```typescript
interface AIFeature {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
}

const AdvancedAIFeatures: React.FC = () => {
  // 5 specialized AI/ML tools:
  // 1. Characterizability Score
  // 2. Smart Filter Assistant
  // 3. HWO Parameter Tuner
  // 4. Target-to-Target Pathing
  // 5. Observational Priority List
};
```

#### 4. Visualization Components

**GalaxyMapPage** (`pages/GalaxyMapPage.tsx`)
```typescript
interface GalaxyMapState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}

const GalaxyMapPage: React.FC = () => {
  // 3D galaxy visualization using Three.js
  // Interactive planet and star system display
  // Real-time filtering and highlighting
  // Measurement and annotation tools
};
```

**ThreeJSVisualization** (`components/visualization/ThreeJSVisualization.tsx`)
```typescript
interface ThreeJSProps {
  data: ExoplanetData[];
  filters: VisualizationFilters;
  onObjectSelect?: (object: CelestialObject) => void;
}

const ThreeJSVisualization: React.FC<ThreeJSProps> = (props) => {
  // Three.js scene management
  // Object positioning and scaling
  // Interactive selection and highlighting
  // Performance optimization for large datasets
};
```

#### 5. Data Processing Components

**CSVUploadSystem** (`components/data/CSVUploadSystem.tsx`)
```typescript
interface CSVUploadProps {
  onUploadComplete?: (results: ProcessingResults) => void;
  onError?: (error: UploadError) => void;
}

const CSVUploadSystem: React.FC<CSVUploadProps> = (props) => {
  // Drag-and-drop file upload
  // Intelligent column mapping
  // Data validation and preprocessing
  // Progress tracking and error handling
};
```

**ColumnMappingInterface** (`components/data/ColumnMappingInterface.tsx`)
```typescript
interface ColumnMappingProps {
  csvColumns: string[];
  expectedColumns: ExpectedColumn[];
  onMappingComplete?: (mapping: ColumnMapping) => void;
}

const ColumnMappingInterface: React.FC<ColumnMappingProps> = (props) => {
  // AI-powered column detection
  // Manual mapping override
  // Confidence scoring
  // Preview and validation
};
```

## State Management

### React Query Implementation

```typescript
// API Service Layer
class ExoplanetAPIService {
  async getPlanets(filters?: PlanetFilters): Promise<ExoplanetData[]> {
    const response = await fetch('/api/planets', {
      method: 'POST',
      body: JSON.stringify(filters),
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }

  async calculateHabitability(data: PlanetParameters[]): Promise<HabitabilityResults> {
    const response = await fetch('/api/calculate-habitability', {
      method: 'POST',
      body: JSON.stringify({ planets: data }),
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }
}

// React Query Hooks
const useExoplanets = (filters?: PlanetFilters) => {
  return useQuery({
    queryKey: ['exoplanets', filters],
    queryFn: () => ExoplanetAPIService.getPlanets(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
};

const useHabitabilityCalculation = () => {
  return useMutation({
    mutationFn: ExoplanetAPIService.calculateHabitability,
    onSuccess: (data) => {
      // Update cache and notify components
    },
    onError: (error) => {
      // Handle error and show user feedback
    }
  });
};
```

### Local State Management

```typescript
// Context Providers for Global State
interface AppContextType {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Notification) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [...prev, notification]);
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      theme,
      notifications,
      setTheme,
      addNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};
```

## TypeScript Integration

### Type Definitions

```typescript
// Core Data Types
interface ExoplanetData {
  pl_name: string;
  pl_rade?: number; // Planet radius (Earth radii)
  pl_bmasse?: number; // Planet mass (Earth masses)
  pl_orbper?: number; // Orbital period (days)
  pl_orbsmax?: number; // Semi-major axis (AU)
  st_teff?: number; // Stellar temperature (K)
  st_rad?: number; // Stellar radius (Solar radii)
  st_mass?: number; // Stellar mass (Solar masses)
  st_dist?: number; // Distance (parsecs)
  habitability_score?: number; // Overall habitability (0-1)
  cdhs_score?: number; // CDHS algorithm score
  ml_prediction?: number; // ML model prediction
  hwo_priority?: 'low' | 'medium' | 'high';
}

// API Response Types
interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: APIError[];
}

interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Component Props Types
interface FilterControlsProps {
  filters: ExoplanetFilters;
  onFiltersChange: (filters: ExoplanetFilters) => void;
  disabled?: boolean;
}

interface DataGridProps<T> {
  data: T[];
  columns: GridColumn<T>[];
  loading?: boolean;
  onRowSelect?: (row: T) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
}
```

### Custom Hooks

```typescript
// Custom Hooks for Reusable Logic
const useFilters = <T>(initialFilters: T) => {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [applied, setApplied] = useState<T>(initialFilters);

  const applyFilters = useCallback(() => {
    setApplied(filters);
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setApplied(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    applied,
    setFilters,
    applyFilters,
    resetFilters
  };
};

const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((value: T) => {
    try {
      setValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  }, [key]);

  return [value, setStoredValue] as const;
};

const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

## Performance Optimization

### Component Optimization

```typescript
// Memoized Components
const PlanetCard = React.memo<PlanetCardProps>(({ planet, onClick }) => {
  return (
    <Card onClick={() => onClick(planet)}>
      <CardContent>
        <Typography variant="h6">{planet.pl_name}</Typography>
        <Typography variant="body2">
          Habitability: {planet.habitability_score?.toFixed(2)}
        </Typography>
      </CardContent>
    </Card>
  );
});

// Virtualized Lists for Large Datasets
const VirtualizedPlanetList: React.FC<VirtualizedListProps> = ({ 
  planets, 
  onPlanetSelect 
}) => {
  const rowRenderer = useCallback(({ index, key, style }: ListRowProps) => {
    const planet = planets[index];
    return (
      <div key={key} style={style}>
        <PlanetCard planet={planet} onClick={onPlanetSelect} />
      </div>
    );
  }, [planets, onPlanetSelect]);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          rowCount={planets.length}
          rowHeight={120}
          rowRenderer={rowRenderer}
        />
      )}
    </AutoSizer>
  );
};
```

### Bundle Optimization

```typescript
// Code Splitting with React.lazy
const GalaxyMapPage = React.lazy(() => import('./pages/GalaxyMapPage'));
const AdvancedAnalytics = React.lazy(() => import('./components/AdvancedAnalytics'));

// Lazy Loading Wrapper
const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={<CircularProgress />}>
      {children}
    </Suspense>
  );
};

// Preloading Critical Routes
const preloadRoute = (routeImport: () => Promise<any>) => {
  const componentImport = routeImport();
  return componentImport;
};

// Preload on hover for better UX
const NavigationLink: React.FC<{ to: string; preload: () => void }> = ({ 
  to, 
  preload, 
  children 
}) => {
  return (
    <Link 
      to={to} 
      onMouseEnter={preload}
      onFocus={preload}
    >
      {children}
    </Link>
  );
};
```

## Testing Architecture

### Component Testing

```typescript
// Jest + React Testing Library
describe('TargetDashboard', () => {
  const mockTargets = [
    {
      pl_name: 'Test Planet',
      habitability_score: 0.85,
      hwo_priority: 'high' as const
    }
  ];

  it('renders target list correctly', async () => {
    render(<TargetDashboard targets={mockTargets} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Planet')).toBeInTheDocument();
      expect(screen.getByText('0.85')).toBeInTheDocument();
    });
  });

  it('handles filter changes', async () => {
    const onFilterChange = jest.fn();
    render(
      <TargetDashboard 
        targets={mockTargets} 
        onFilterChange={onFilterChange} 
      />
    );

    const filterInput = screen.getByLabelText('Minimum Habitability');
    fireEvent.change(filterInput, { target: { value: '0.5' } });

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith({
        minHabitability: 0.5
      });
    });
  });
});
```

### Integration Testing

```typescript
// API Integration Tests
describe('ExoplanetAPI', () => {
  it('fetches planets with filters', async () => {
    const mockData = [{ pl_name: 'Test Planet' }];
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData })
    } as Response);

    const result = await ExoplanetAPIService.getPlanets({
      minHabitability: 0.5
    });

    expect(fetch).toHaveBeenCalledWith('/api/planets', {
      method: 'POST',
      body: JSON.stringify({ minHabitability: 0.5 }),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(result).toEqual({ data: mockData });
  });
});
```

## Build and Deployment

### Development Build

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js"
  }
}
```

### Production Optimizations

- **Tree shaking** for unused code elimination
- **Code splitting** for reduced initial bundle size
- **Asset optimization** with image compression
- **Caching strategies** with service worker
- **CDN integration** for static assets

### Environment Configuration

```typescript
// Environment Variables
interface EnvironmentConfig {
  API_BASE_URL: string;
  ENABLE_ANALYTICS: boolean;
  DEBUG_MODE: boolean;
  VERSION: string;
}

const config: EnvironmentConfig = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0'
};
```

This frontend architecture provides a scalable, maintainable, and performant foundation for the NASA HWO Habitability Explorer while following React best practices and modern development patterns.
