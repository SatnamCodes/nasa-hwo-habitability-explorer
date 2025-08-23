# User Manual - NASA HWO Habitability Explorer

**Version 1.0.0 | NASA Submission Ready**

Welcome to the NASA HWO Habitability Explorer - your comprehensive platform for exoplanet habitability assessment and mission planning for NASA's Habitable Worlds Observatory.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Exploring Exoplanets](#exploring-exoplanets)
4. [Using AI-Powered Features](#using-ai-powered-features)
5. [Data Analysis Tools](#data-analysis-tools)
6. [Uploading Custom Data](#uploading-custom-data)
7. [3D Galaxy Visualization](#3d-galaxy-visualization)
8. [Collaborative Features](#collaborative-features)
9. [Troubleshooting](#troubleshooting)
10. [Frequently Asked Questions](#frequently-asked-questions)

## Getting Started

### Welcome to the NASA HWO Habitability Explorer

The NASA Habitable Worlds Observatory (HWO) Habitability Explorer is a comprehensive tool designed to help astronomers, researchers, and educators explore potentially habitable exoplanets and plan observations for the future HWO mission.

### System Requirements

**Minimum Requirements:**
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection
- 4GB RAM
- 1920×1080 screen resolution (recommended)

**Recommended Setup:**
- High-resolution monitor (2560×1440 or higher)
- 8GB+ RAM for smooth 3D visualization
- WebGL 2.0 compatible graphics
- High-speed internet connection for large dataset operations

### First Time Login

1. Navigate to `https://hwo-explorer.nasa.gov`
2. Click "Sign In" in the top-right corner
3. Enter your NASA credentials or institutional login
4. Complete the brief user survey (optional)
5. Take the interactive tour to familiarize yourself with key features

### User Interface Overview

The interface is organized into several main areas:

**Top Navigation Bar:**
- Dashboard (Home)
- HWO Targets
- Data Analysis
- 3D Galaxy View
- Upload Data
- User Profile

**Left Sidebar:**
- Quick Filters
- Recent Searches
- Saved Queries
- Bookmarked Planets

**Main Content Area:**
- Dynamic content based on current section
- Interactive tables and visualizations
- Detail panels and forms

**Right Panel (when active):**
- Planet details
- AI insights
- Analysis results
- Help and documentation
   - Planet Explorer: Comprehensive database browser

## Dashboard Overview

### Main Statistics Panel

The dashboard displays real-time statistics synchronized with your current data:

- **Total Targets**: Complete count of exoplanets in database
- **High Priority**: Number of high-priority HWO targets
- **Average AI Score**: Mean ML-predicted habitability
- **Filtered Results**: Currently active filter count

### Quick Actions

**Upload New Data**
- Click "Upload CSV" for custom dataset analysis
- Supports various exoplanet catalog formats
- Intelligent column mapping and validation

**Access Key Features**
- HWO Target Dashboard: Mission planning interface
- Galaxy Map: 3D visualization and exploration
- Advanced AI Tools: 5 specialized analysis features

### Recent Activity

Monitor your recent actions and analyses:
- File uploads and processing status
- Calculation results and scores
- Filter applications and modifications
- Export operations and downloads

## HWO Target Dashboard

### Target Analysis Interface

**Priority Scoring**
- Comprehensive habitability assessment
- HWO-specific optimization criteria
- ML-enhanced prediction confidence
- Observable window calculations

**Filter Controls**
- **Distance Range**: Limit by stellar distance (parsecs)
- **Habitability Score**: Minimum habitability threshold
- **Stellar Type**: Filter by stellar classification
- **Observable**: Current observation feasibility

**Sort Options**
- Priority Score (High to Low)
- Distance (Nearest First)
- Habitability Score
- Discovery Date
- Stellar Temperature

### Target Details Panel

Click any target to view comprehensive details:

**Planetary Parameters**
- Physical characteristics (radius, mass, density)
- Orbital parameters (period, distance, eccentricity)
- Temperature estimates and habitability zones

**Stellar Properties**
- Stellar classification and temperature
- Radius, mass, and luminosity
- Distance and proper motion
- Activity levels and variability

**HWO Assessment**
- Overall priority ranking
- Observability analysis
- Characterizability potential
- Recommended observation strategy

## Enhanced CSV Upload

### Supported Formats

**File Requirements:**
- CSV format (.csv extension)
- UTF-8 encoding recommended
- Maximum file size: 100MB
- Maximum rows: 50,000

**Common Data Sources:**
- NASA Exoplanet Archive
- Kepler/K2 mission data
- TESS mission catalogs
- Custom research datasets

### Column Mapping Process

1. **File Upload**
   - Drag and drop CSV file or click to browse
   - Initial file validation and preview
   - Automatic encoding detection

2. **Smart Column Detection**
   - AI-powered column identification
   - Confidence scores for each mapping
   - Manual override capabilities
   - Missing column notifications

3. **Data Validation**
   - Range checks for physical parameters
   - Unit conversion suggestions
   - Invalid data highlighting
   - Quality score calculation

4. **Processing Results**
   - Success/error summary
   - Habitability score calculations
   - ML prediction generation
   - Priority classification

### Column Mapping Reference

**Required Columns:**
- Planet Name (`pl_name`)
- Planet Radius (`pl_rade`) - Earth radii
- Planet Mass (`pl_bmasse`) - Earth masses
- Orbital Period (`pl_orbper`) - days

**Recommended Columns:**
- Stellar Temperature (`st_teff`) - Kelvin
- Stellar Radius (`st_rad`) - Solar radii
- Stellar Mass (`st_mass`) - Solar masses
- Distance (`st_dist`) - parsecs

**Optional Enhancement Columns:**
- Discovery Year (`pl_disc`)
- Discovery Facility (`pl_facility`)
- Orbital Eccentricity (`pl_orbeccen`)
- Inclination (`pl_orbincl`)

## Advanced AI Features

### 1. Characterizability Score

**Purpose:** Assess how well a planet can be characterized by HWO

**Usage:**
1. Select targets from the main list
2. Click "AI Analysis" → "Characterizability Score"
3. Review detailed scoring breakdown
4. Export results for mission planning

**Scoring Factors:**
- Stellar brightness and proximity
- Planet-star contrast ratio
- Atmospheric signal strength
- Instrument capability matching

### 2. Smart Filter Assistant

**Purpose:** AI-powered intelligent filtering and target recommendation

**Features:**
- Natural language filter descriptions
- Context-aware parameter suggestions
- Multi-criteria optimization
- Dynamic threshold adjustment

**Example Queries:**
- "Show me nearby super-Earths in the habitable zone"
- "Find the best targets for atmospheric spectroscopy"
- "Prioritize by observation efficiency"

### 3. HWO Parameter Tuner

**Purpose:** Optimize observatory parameters for target selection

**Capabilities:**
- Instrument configuration optimization
- Observation time allocation
- Target scheduling assistance
- Cost-benefit analysis

**Parameters Tuned:**
- Telescope pointing strategies
- Exposure time optimization
- Filter selection
- Detector configuration

### 4. Target-to-Target Pathing

**Purpose:** Calculate optimal observation sequences

**Applications:**
- Mission timeline planning
- Fuel-efficient pointing strategies
- Seasonal observation windows
- Multi-target campaigns

**Output:**
- Optimized observation sequences
- Time and resource estimates
- Alternative pathway options
- Efficiency metrics

### 5. Observational Priority List

**Purpose:** Generate prioritized observation schedules

**Features:**
- Dynamic priority recalculation
- Seasonal visibility constraints
- Instrument availability integration
- Science objective weighting

**Customization Options:**
- Mission duration constraints
- Scientific priority weighting
- Technical feasibility filters
- Budget considerations

## Galaxy Map Explorer

### 3D Visualization Interface

**Navigation Controls:**
- Mouse drag: Rotate view
- Scroll wheel: Zoom in/out
- Right-click drag: Pan view
- Double-click: Focus on target

**Display Options:**
- **Star Systems**: Toggle stellar representation
- **Planet Markers**: Size by habitability score
- **Distance Grid**: Parsec-based reference grid
- **Constellation Lines**: Traditional star patterns

**Filter Integration:**
- Real-time filter application
- Visual highlighting of results
- Distance-based grouping
- Priority color coding

### Interactive Features

**Target Selection:**
- Click planets for detailed information
- Multi-select for batch operations
- Context menus for quick actions
- Bookmark favorite targets

**Measurement Tools:**
- Distance measurements between objects
- Angular separation calculations
- Observation angle visualization
- Field of view overlays

**Export Capabilities:**
- High-resolution image export
- 3D model data export
- Observation planning files
- Custom view bookmarks

## Planet Explorer

### Database Browser

**Search Capabilities:**
- Text search across all fields
- Advanced filter combinations
- Fuzzy matching for planet names
- Historical data comparison

**Data Presentation:**
- Sortable data tables
- Graphical parameter plots
- Statistical distributions
- Comparative analysis charts

**Detailed Views:**
- Individual planet profiles
- System-level information
- Discovery history
- Literature references

### Data Analysis Tools

**Statistical Analysis:**
- Population statistics
- Parameter correlations
- Trend analysis
- Distribution plots

**Comparison Tools:**
- Side-by-side planet comparison
- Parameter ratio calculations
- Ranking and percentile information
- Similar planet suggestions

## Data Export and Analysis

### Export Options

**Data Formats:**
- CSV: Complete datasets with all calculations
- JSON: Structured data for API integration
- Excel: Formatted reports with charts
- PDF: Publication-ready summaries

**Export Content:**
- Filtered target lists
- Habitability scores and rankings
- AI analysis results
- Observation recommendations

### Analysis Integration

**External Tool Compatibility:**
- Python/Pandas data frames
- R statistical analysis
- MATLAB arrays
- Astronomical software packages

**API Access:**
- RESTful API endpoints
- Real-time data access
- Batch processing capabilities
- Integration documentation

## Tips and Best Practices

### Optimal Performance

**Large Dataset Handling:**
- Upload files in chunks < 50MB
- Use server-side filtering for large datasets
- Enable browser hardware acceleration
- Close unnecessary browser tabs

**Analysis Efficiency:**
- Start with broad filters, then narrow down
- Use AI features for preliminary screening
- Save frequently used filter combinations
- Export results for offline analysis

### Data Quality

**Best Practices:**
- Verify column mappings before processing
- Check for unit consistency
- Review outliers and anomalies
- Validate against known catalogs

**Common Issues to Avoid:**
- Mixed unit systems in single columns
- Placeholder values (99.99, -999) as real data
- Inconsistent naming conventions
- Missing critical parameters

### Mission Planning Workflow

1. **Initial Survey**: Browse complete database for context
2. **Filter Application**: Apply mission-specific constraints
3. **AI Analysis**: Use advanced features for optimization
4. **Priority Ranking**: Generate observation priority lists
5. **Export Planning**: Generate mission-ready documents

## Troubleshooting

### Common Issues

**Performance Problems:**
- **Symptom**: Slow loading or response times
- **Solution**: Reduce dataset size, clear browser cache, check system resources

**Upload Failures:**
- **Symptom**: CSV upload errors or timeouts
- **Solution**: Check file format, size limits, and internet connection

**Visualization Issues:**
- **Symptom**: 3D map not displaying correctly
- **Solution**: Update browser, enable hardware acceleration, check WebGL support

**Data Inconsistencies:**
- **Symptom**: Unexpected habitability scores
- **Solution**: Verify column mappings, check data ranges, review calculation methodology

### Error Messages

**"Failed to fetch"**
- Backend server not running
- Check server status and restart if needed

**"Invalid column mapping"**
- Required columns not properly identified
- Review and correct column assignments

**"Data validation error"**
- Invalid parameter values detected
- Check data ranges and formats

**"Memory limit exceeded"**
- Dataset too large for browser processing
- Use server-side processing or reduce data size

### Getting Help

**Documentation Resources:**
- [API Documentation](api/README.md) - Complete API reference
- [Algorithm Documentation](algorithms/README.md) - Scientific methodology
- [Deployment Guide](deployment/README.md) - Setup and configuration

**Technical Support:**
- [GitHub Issues](https://github.com/SatnamCodes/nasa-hwo-habitability-explorer/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/SatnamCodes/nasa-hwo-habitability-explorer/discussions) - Community support

**NASA Resources:**
- [NASA HWO Mission](https://www.nasa.gov/hwo) - Official mission information
- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) - Data sources

## Appendices

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Global Search | Ctrl/Cmd + K |
| Toggle Filters | F |
| Export Data | Ctrl/Cmd + E |
| Refresh View | R |
| Help | H |

### Parameter Definitions

**Habitability Score**: Composite score (0-1) based on multiple factors including temperature, size, orbit, and stellar properties.

**CDHS Score**: Comprehensive Distance Habitability Score - algorithm-specific assessment based on NASA requirements.

**ML Prediction**: Machine learning model confidence for habitability potential.

**HWO Priority**: Mission-specific ranking (low/medium/high) based on observational feasibility and scientific value.

---

**Support:** For technical assistance, please refer to our [GitHub Issues](https://github.com/SatnamCodes/nasa-hwo-habitability-explorer/issues) page.

**Last Updated:** August 23, 2025  
**Version:** 1.0.0 - NASA Submission Ready ✅
