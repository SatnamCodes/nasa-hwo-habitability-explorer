# HWO Advanced Features Test Data

## Overview
This folder contains test CSV files designed to demonstrate and test all the advanced AI/ML features of the HWO Habitability Explorer.

## Test Files

### 1. `hwo_test_targets.csv`
**Purpose**: Primary test file with clear column naming and comprehensive data
**Features Tested**: All advanced features
**Records**: 30 exoplanets with diverse characteristics

**Columns**:
- `Planet_Name`: Target identification
- `Distance_pc`: Distance in parsecs (key for HWO feasibility)
- `Star_Temperature_K`: Stellar effective temperature
- `Star_Radius_Solar`: Stellar radius in solar units
- `Star_Mass_Solar`: Stellar mass in solar units
- `Planet_Radius_Earth`: Planet radius in Earth units
- `Planet_Mass_Earth`: Planet mass in Earth units
- `Orbital_Period_days`: Orbital period
- `Semi_Major_Axis_AU`: Semi-major axis in AU
- `Equilibrium_Temperature_K`: Planet equilibrium temperature
- `Discovery_Year`: Year of discovery
- `Detection_Method`: How the planet was detected
- `Visual_Magnitude`: Apparent magnitude of host star
- `Spectral_Type`: Stellar spectral classification
- `Transit_Flag`: 1 if transiting, 0 if not
- `RV_Flag`: 1 if detected via radial velocity
- `Imaging_Flag`: 1 if directly imaged
- `Astrometry_Flag`: 1 if detected via astrometry
- `Habitability_Score`: Pre-calculated habitability score (0-100)
- `Priority_Level`: High/Medium/Low priority classification

### 2. `advanced_features_test.csv`
**Purpose**: NASA Exoplanet Archive format test file
**Features Tested**: Column mapping intelligence
**Records**: 42 exoplanets with standard NASA naming conventions

**Columns**: Standard NASA Exoplanet Archive format
- `pl_name`: Planet name
- `sy_dist`: System distance
- `st_teff`: Stellar temperature
- `st_rad`: Stellar radius
- `st_mass`: Stellar mass
- `pl_rade`: Planet radius (Earth units)
- `pl_masse`: Planet mass (Earth units)
- `pl_orbper`: Orbital period
- `pl_orbsmax`: Semi-major axis
- `pl_eqt`: Equilibrium temperature
- `disc_year`: Discovery year
- `discoverymethod`: Detection method
- And more...

## Testing Each Advanced Feature

### 1. Characterizability Score 📊
**Test Method**:
1. Upload `hwo_test_targets.csv`
2. Click "Characterizability Score 📊" button
3. Observe AI/ML model results for different target types

**Expected Results**:
- High scores (80-100): Proxima Cen b, TRAPPIST-1 e,f, K2-18 b
- Medium scores (50-79): Kepler targets, TOI planets
- Low scores (0-49): Hot Jupiters like WASP-121 b, 55 Cnc e

**Key Insights**:
- Nearby M-dwarf planets score highest
- Transit+RV detection boosts scores
- Hot planets score lower due to challenging atmospheres

### 2. Smart Filter Assistant 🤖
**Test Method**:
1. Load test data
2. Click "Smart Filter Assistant 🤖"
3. Try different preset filters

**Filter Presets to Test**:
- **Prime HWO Candidates**: Should return ~8 targets (score >80, distance <50pc)
- **Habitable Zone Focus**: Should return ~15 targets (temperate planets)
- **Nearby Sun-like Stars**: Should return G/K star systems <25pc

**Expected AI Recommendations**:
- Prioritize characterization scores >75
- Focus on distances <30 parsecs
- Prefer transit + RV confirmed planets

### 3. HWO Parameter Tuner 🔭
**Test Method**:
1. Upload test data
2. Open Parameter Tuner
3. Adjust coronagraph and observing parameters

**Parameters to Test**:
- Inner Working Angle: 2.0-5.0 λ/D
- Contrast Ratio: 1e-8 to 1e-12
- Integration Time: 1-50 hours
- Spectral Resolution: 20-200

**Expected Behavior**:
- Optimization results should show ~85% science return
- Recommendations for nearby vs distant targets
- Trade-offs between detection and characterization

### 4. Target-to-Target Pathing 🚀
**Test Method**:
1. Load test data with 10+ targets
2. Open Pathing Analysis
3. Review optimized observation sequence

**Expected Results**:
- Sequence optimization reduces slew time by ~23%
- Nearby targets (Proxima, Ross 128) grouped together
- TRAPPIST-1 system observations clustered
- Efficiency metrics >80%

**Validation Points**:
- Check slew times are realistic (5-50 minutes)
- Verify high-priority targets appear early in sequence
- Confirm observation windows are reasonable (2-8 hours)

### 5. Observational Priority List 📝
**Test Method**:
1. Upload full test dataset
2. Open Priority List dialog
3. Review composite scoring and rankings

**Expected Top Priorities**:
1. TRAPPIST-1 e (composite score ~95)
2. K2-18 b (composite score ~92)
3. Proxima Centauri b (composite score ~89)
4. TRAPPIST-1 f (composite score ~87)
5. Wolf 1061 c (composite score ~85)

**Scoring Validation**:
- Science Value (40%): Based on habitability score
- Technical Feasibility (35%): Based on AI confidence/distance
- Strategic Importance (25%): Based on priority level

## Data Quality Features

### Column Mapping Intelligence
**Test Scenarios**:
1. Upload `advanced_features_test.csv` (NASA format)
   - Should auto-map: `pl_name` → Planet Name, `sy_dist` → Distance, etc.
   - Mapping quality should be >85%

2. Upload `hwo_test_targets.csv` (clear naming)
   - Should achieve >95% mapping quality
   - All required fields should be identified

### Error Handling
**Test Cases**:
1. Upload file with missing columns
2. Upload file with incorrect units
3. Upload file with invalid data ranges

**Expected Behavior**:
- Clear error messages
- Suggestions for manual mapping
- Data validation warnings

## Performance Benchmarks

### Expected Processing Times
- File upload: <2 seconds
- Column mapping: <3 seconds
- Characterizability analysis: <5 seconds
- Path optimization: <10 seconds
- Priority ranking: <3 seconds

### Memory Usage
- 30 targets: ~2MB memory footprint
- 100 targets: ~5MB memory footprint
- 1000 targets: ~25MB memory footprint

## Validation Checklist

### ✅ Basic Functionality
- [ ] CSV upload completes successfully
- [ ] Column mapping dialog appears
- [ ] Data preview shows correctly
- [ ] All 5 advanced features accessible

### ✅ Characterizability Score
- [ ] Score calculation completes
- [ ] Results table displays properly
- [ ] Confidence levels shown
- [ ] Export function works

### ✅ Smart Filter Assistant
- [ ] Preset filters apply correctly
- [ ] AI recommendations appear
- [ ] Filter counts match expectations
- [ ] Target filtering works

### ✅ Parameter Tuner
- [ ] Sliders adjust parameters
- [ ] Optimization results update
- [ ] Recommendations provided
- [ ] Parameter export works

### ✅ Pathing Analysis
- [ ] Sequence table populates
- [ ] Efficiency metrics calculated
- [ ] Slew times realistic
- [ ] Schedule export functions

### ✅ Priority List
- [ ] Composite scoring works
- [ ] Rankings appear logical
- [ ] Priority categories assigned
- [ ] Weight adjustment available

## Common Issues & Solutions

### Issue: "Manual mapping not implemented"
**Solution**: Ensure latest code is deployed with enhanced CSV upload integration

### Issue: Column mapping fails
**Solution**: Check column names match expected patterns, use clear naming

### Issue: Low characterizability scores
**Solution**: Verify stellar and planetary parameters are in correct units

### Issue: Path optimization incomplete
**Solution**: Ensure minimum 5 targets loaded for meaningful optimization

## Test Data Attribution

The test data includes real exoplanets from:
- NASA Exoplanet Archive
- TRAPPIST-1 system (Gillon et al. 2017)
- Proxima Centauri b (Anglada-Escudé et al. 2016)
- K2-18 b atmosphere studies
- Recent TESS and ground-based discoveries

All data values are representative but may be simplified for testing purposes.
