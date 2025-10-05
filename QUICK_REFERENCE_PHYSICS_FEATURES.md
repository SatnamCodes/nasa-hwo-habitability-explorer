# Quick Reference: Physics-Based Habitability Features

## 🚀 Quick Start

```python
from data_science.algorithms.habitability_features import create_all_physics_features

features = create_all_physics_features(
    planet_mass=1.0,         # M⊕
    planet_radius=1.0,       # R⊕
    stellar_mass=1.0,        # M☉
    stellar_temp=5778,       # K
    stellar_radius=1.0,      # R☉
    semi_major_axis=1.0,     # AU
    orbital_period=365.25    # days
)
```

## 📊 Top 20 Features for ML

| # | Feature Name | Type | Importance |
|---|--------------|------|------------|
| 1 | `composite_habitability_score` | Float (0-1) | ⭐⭐⭐⭐⭐ |
| 2 | `hz_placement_score` | Float (0-1) | ⭐⭐⭐⭐⭐ |
| 3 | `earth_similarity_index` | Float (0-1) | ⭐⭐⭐⭐⭐ |
| 4 | `equilibrium_temp_kelvin` | Float | ⭐⭐⭐⭐⭐ |
| 5 | `in_habitable_zone` | Boolean | ⭐⭐⭐⭐ |
| 6 | `jeans_parameter_h2o` | Float | ⭐⭐⭐⭐ |
| 7 | `jeans_parameter_n2` | Float | ⭐⭐⭐⭐ |
| 8 | `atmospheric_retention_score` | Float (0-1) | ⭐⭐⭐⭐ |
| 9 | `bulk_density_gcc` | Float | ⭐⭐⭐⭐ |
| 10 | `escape_velocity_earth_ratio` | Float | ⭐⭐⭐ |
| 11 | `scale_height_n2_km` | Float | ⭐⭐⭐ |
| 12 | `planet_type_category` | Int (1-4) | ⭐⭐⭐ |
| 13 | `tidal_heating_wkg` | Float | ⭐⭐⭐ |
| 14 | `likely_tidally_locked` | Boolean | ⭐⭐⭐ |
| 15 | `stellar_lifetime_gyr` | Float | ⭐⭐⭐ |
| 16 | `stellar_luminosity_solar` | Float | ⭐⭐ |
| 17 | `hz_normalized_distance` | Float | ⭐⭐ |
| 18 | `temp_deviation_from_288k` | Float | ⭐⭐ |
| 19 | `surface_gravity_earth_units` | Float | ⭐⭐ |
| 20 | `insolation_flux_earth_units` | Float | ⭐⭐ |

## 🔑 Key Thresholds

| Parameter | Excellent | Good | Poor |
|-----------|-----------|------|------|
| Jeans Parameter (λ) | > 15 | 10-15 | < 6 |
| Eq. Temperature (K) | 250-320 | 200-400 | < 200 or > 400 |
| HZ Placement Score | > 0.8 | 0.5-0.8 | < 0.3 |
| ESI | > 0.8 | 0.6-0.8 | < 0.5 |
| Bulk Density (g/cm³) | 3.5-8 | 2-3.5 or 8-10 | < 2 or > 10 |
| Stellar Lifetime (Gyr) | > 3 | 1-3 | < 1 |

## 📏 Unit Conversions

```python
# Masses
1 M⊕ = 5.972×10²⁴ kg
1 M☉ = 1.989×10³⁰ kg
1 M♃ = 317.8 M⊕

# Radii
1 R⊕ = 6.371×10⁶ m
1 R☉ = 6.96×10⁸ m
1 R♃ = 11.2 R⊕

# Distances
1 AU = 1.496×10¹¹ m
1 pc = 3.086×10¹⁶ m
```

## 🌟 Example Values

### Earth
```
T_eq = 288 K
λ(N₂) = 30
ESI = 1.0
ρ = 5.51 g/cm³
v_esc = 11.2 km/s
```

### Mars
```
T_eq = 210 K
λ(N₂) = 6 (poor!)
ESI = 0.64
ρ = 3.93 g/cm³
v_esc = 5.0 km/s
```

### Proxima Cen b
```
T_eq = 234 K
Tidally locked
HZ: Yes
ESI = 0.85
```

## 🔬 Physics Formulas

### Temperature
```
T_eq = [(L(1-A))/(16πσa²)]^0.25 × f_GH
```

### Jeans Parameter
```
λ = GMm / (Rk_BT)
```

### Scale Height
```
H = k_BT / (mg)
```

### Tidal Heating
```
dE/dt ∝ e²/a⁶
```

## 📚 Files

| File | Purpose |
|------|---------|
| `physics_constants.py` | Constants & conversions |
| `stellar_physics.py` | Stellar calculations |
| `atmospheric_physics.py` | Atmosphere retention |
| `orbital_physics.py` | Tidal effects |
| `habitability_features.py` | Main integration |

## 🧪 Testing

```bash
# Run all tests
py -3 test_physics_features.py

# Expected output:
# ✅ All 14 tests passed
# ✅ 46 features generated
```

## 🎯 Integration Checklist

- [ ] Import `HabitabilityFeatureEngineering`
- [ ] Load exoplanet data
- [ ] Generate physics features for each planet
- [ ] Select top 20 features
- [ ] Handle missing values (median imputation)
- [ ] Scale features (StandardScaler)
- [ ] Train ML model
- [ ] Validate performance (R² > 0.90)
- [ ] Save model & metadata

## 📖 Documentation

- `PHYSICS_FEATURES_DOCUMENTATION.md` - Complete physics guide
- `PHYSICS_IMPLEMENTATION_SUMMARY.md` - ML integration guide
- `PHYSICS_FEATURE_COMPLETION_REPORT.md` - Implementation report

---

**Version:** 1.0.0 | **Status:** ✅ Ready | **Date:** Oct 2025
