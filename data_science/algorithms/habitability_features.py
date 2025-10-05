"""
Integrated Physics-Based Feature Engineering

This module integrates all physics calculations to create a comprehensive
feature vector for machine learning habitability models.

Usage:
    from data_science.algorithms.habitability_features import create_all_physics_features
    
    features = create_all_physics_features(
        planet_mass=1.2,
        planet_radius=1.1,
        stellar_mass=0.9,
        stellar_temp=5200,
        ... (other parameters)
    )
"""

import numpy as np
import pandas as pd
from typing import Dict, Optional, List

# Try relative imports first, fall back to absolute
try:
    from .physics_constants import PhysicalConstants
    from .stellar_physics import StellarPhysics
    from .atmospheric_physics import AtmosphericPhysics
    from .orbital_physics import OrbitalPhysics
except ImportError:
    from physics_constants import PhysicalConstants
    from stellar_physics import StellarPhysics
    from atmospheric_physics import AtmosphericPhysics
    from orbital_physics import OrbitalPhysics


class HabitabilityFeatureEngineering:
    """
    Complete physics-based feature engineering for exoplanet habitability.
    
    This class generates 30+ scientifically-grounded features based on
    astrophysical principles for machine learning models.
    """
    
    def __init__(self):
        self.const = PhysicalConstants()
        self.stellar = StellarPhysics()
        self.atmosphere = AtmosphericPhysics()
        self.orbital = OrbitalPhysics()
    
    def calculate_all_features(
        self,
        # Planetary parameters
        planet_mass: float,
        planet_radius: float,
        semi_major_axis: float,
        orbital_period: float,
        stellar_mass: float,
        stellar_temp: float,
        eccentricity: float = 0.0,
        stellar_radius: Optional[float] = None,
        stellar_age: Optional[float] = None,
        stellar_distance: Optional[float] = None,
        
        # Optional parameters
        albedo: float = 0.3,
        greenhouse_factor: float = 1.1
    ) -> Dict[str, float]:
        """
        Calculate all physics-based habitability features.
        
        Parameters:
        -----------
        Planet Parameters:
            planet_mass : float - Mass in Earth masses (M⊕)
            planet_radius : float - Radius in Earth radii (R⊕)
            semi_major_axis : float - Orbital distance in AU
            orbital_period : float - Period in days
            eccentricity : float - Orbital eccentricity (0-1), default 0
        
        Stellar Parameters:
            stellar_mass : float - Mass in solar masses (M☉)
            stellar_temp : float - Effective temperature in Kelvin
            stellar_radius : float, optional - Radius in solar radii (R☉)
            stellar_age : float, optional - Age in billions of years
            stellar_distance : float, optional - Distance in parsecs
        
        Optional Parameters:
            albedo : float - Bond albedo (0-1), default 0.3
            greenhouse_factor : float - Atmospheric warming, default 1.1
        
        Returns:
        --------
        dict
            Dictionary containing 30+ feature values with descriptive keys
        """
        
        features = {}
        
        # ====================================================================
        # INPUT FEATURES (Basic Parameters)
        # ====================================================================
        
        features['planet_mass_earth'] = planet_mass
        features['planet_radius_earth'] = planet_radius
        features['stellar_mass_solar'] = stellar_mass
        features['stellar_temp_kelvin'] = stellar_temp
        features['semi_major_axis_au'] = semi_major_axis
        features['orbital_period_days'] = orbital_period
        features['eccentricity'] = eccentricity
        
        # ====================================================================
        # STELLAR PROPERTIES
        # ====================================================================
        
        # Luminosity (multiple methods if data available)
        if stellar_radius is not None:
            luminosity = self.stellar.calculate_luminosity(
                stellar_mass, stellar_temp, stellar_radius
            )
        else:
            luminosity = self.stellar.calculate_luminosity(stellar_mass)
            # Estimate radius from mass-radius relation
            stellar_radius = stellar_mass ** 0.8
        
        features['stellar_luminosity_solar'] = luminosity
        features['stellar_radius_solar'] = stellar_radius
        
        # Stellar lifetime (time for life to evolve)
        features['stellar_lifetime_gyr'] = self.stellar.calculate_main_sequence_lifetime(
            stellar_mass
        )
        
        # ====================================================================
        # TEMPERATURE AND ENERGY BUDGET
        # ====================================================================
        
        # Equilibrium temperature
        eq_temp = self.stellar.calculate_equilibrium_temperature(
            luminosity, semi_major_axis, albedo, greenhouse_factor
        )
        features['equilibrium_temp_kelvin'] = eq_temp
        
        # Temperature deviation from Earth-optimal
        features['temp_deviation_from_288k'] = abs(eq_temp - 288)
        
        # Insolation flux (relative to Earth)
        features['insolation_flux_earth_units'] = luminosity / (semi_major_axis ** 2)
        
        # ====================================================================
        # HABITABLE ZONE ANALYSIS
        # ====================================================================
        
        hz = self.stellar.calculate_habitable_zone_boundaries(luminosity, stellar_temp)
        
        features['hz_inner_au'] = hz['inner']
        features['hz_outer_au'] = hz['outer']
        features['hz_center_au'] = hz['center']
        features['hz_width_au'] = hz['outer'] - hz['inner']
        
        # Distance from HZ center (normalized)
        features['hz_distance_from_center'] = abs(semi_major_axis - hz['center'])
        features['hz_normalized_distance'] = features['hz_distance_from_center'] / hz['center']
        
        # Is planet in HZ?
        features['in_habitable_zone'] = float(
            hz['inner'] <= semi_major_axis <= hz['outer']
        )
        
        # HZ placement score (1.0 at center, 0 outside)
        if hz['inner'] <= semi_major_axis <= hz['outer']:
            # Gaussian-like score
            hz_score = np.exp(-(features['hz_distance_from_center'] / (features['hz_width_au'] / 4)) ** 2)
        else:
            hz_score = 0.0
        features['hz_placement_score'] = hz_score
        
        # ====================================================================
        # ATMOSPHERIC RETENTION
        # ====================================================================
        
        # Surface gravity
        features['surface_gravity_ms2'] = self.atmosphere.calculate_surface_gravity(
            planet_mass, planet_radius
        )
        features['surface_gravity_earth_units'] = features['surface_gravity_ms2'] / self.const.g_earth
        
        # Escape velocity
        features['escape_velocity_kms'] = self.atmosphere.calculate_escape_velocity(
            planet_mass, planet_radius
        )
        features['escape_velocity_earth_ratio'] = (
            features['escape_velocity_kms'] / (self.const.v_esc_earth / 1000)
        )
        
        # Jeans parameter for different molecules
        features['jeans_parameter_h2'] = self.atmosphere.calculate_jeans_parameter(
            planet_mass, planet_radius, eq_temp, molecular_mass=2.0
        )
        features['jeans_parameter_h2o'] = self.atmosphere.calculate_jeans_parameter(
            planet_mass, planet_radius, eq_temp, molecular_mass=18.0
        )
        features['jeans_parameter_n2'] = self.atmosphere.calculate_jeans_parameter(
            planet_mass, planet_radius, eq_temp, molecular_mass=28.0
        )
        features['jeans_parameter_co2'] = self.atmosphere.calculate_jeans_parameter(
            planet_mass, planet_radius, eq_temp, molecular_mass=44.0
        )
        
        # Atmospheric scale height (for different atmospheres)
        features['scale_height_h2_km'] = self.atmosphere.calculate_scale_height(
            eq_temp, planet_mass, planet_radius, mean_molecular_weight=2.0
        )
        features['scale_height_n2_km'] = self.atmosphere.calculate_scale_height(
            eq_temp, planet_mass, planet_radius, mean_molecular_weight=28.0
        )
        features['scale_height_co2_km'] = self.atmosphere.calculate_scale_height(
            eq_temp, planet_mass, planet_radius, mean_molecular_weight=44.0
        )
        
        # Atmospheric retention score (based on Jeans parameters)
        # Average across key molecules, normalized
        jeans_avg = (features['jeans_parameter_h2o'] + features['jeans_parameter_n2']) / 2
        features['atmospheric_retention_score'] = min(1.0, jeans_avg / 15.0)
        
        # ====================================================================
        # PLANETARY COMPOSITION
        # ====================================================================
        
        # Bulk density
        volume = (4/3) * np.pi * (planet_radius * self.const.R_earth) ** 3
        density_kg_m3 = (planet_mass * self.const.M_earth) / volume
        features['bulk_density_gcc'] = density_kg_m3 / 1000
        
        # Density relative to Earth
        features['density_earth_ratio'] = features['bulk_density_gcc'] / self.const.rho_earth
        
        # Planet classification based on size and density
        if planet_radius < 1.5 and features['bulk_density_gcc'] > 3.5:
            planet_type = 1  # Rocky/terrestrial
        elif planet_radius < 2.5 and features['bulk_density_gcc'] < 3.5:
            planet_type = 2  # Water world
        elif planet_radius < 4.0:
            planet_type = 3  # Sub-Neptune
        else:
            planet_type = 4  # Gas giant
        features['planet_type_category'] = planet_type
        
        # ====================================================================
        # ORBITAL DYNAMICS
        # ====================================================================
        
        # Orbital velocity
        features['orbital_velocity_kms'] = self.orbital.calculate_orbital_velocity(
            stellar_mass, semi_major_axis
        )
        
        # Hill sphere (gravitational influence)
        features['hill_sphere_au'] = self.orbital.calculate_hill_sphere(
            planet_mass, stellar_mass, semi_major_axis
        )
        
        # Tidal effects
        features['tidal_heating_wkg'] = self.orbital.calculate_tidal_heating_rate(
            planet_mass, planet_radius, stellar_mass, semi_major_axis,
            eccentricity, orbital_period
        )
        
        # Tidal locking timescale
        features['tidal_locking_time_myr'] = self.orbital.calculate_tidal_locking_timescale(
            planet_mass, planet_radius, stellar_mass, semi_major_axis
        )
        
        # Is planet likely tidally locked? (locked if timescale < stellar age)
        if stellar_age is not None:
            features['likely_tidally_locked'] = float(
                features['tidal_locking_time_myr'] < stellar_age * 1000
            )
        else:
            # Assume 5 Gyr stellar age
            features['likely_tidally_locked'] = float(
                features['tidal_locking_time_myr'] < 5000
            )
        
        # ====================================================================
        # HABITABILITY INDICES
        # ====================================================================
        
        # Earth Similarity Index (ESI)
        esi_interior = (
            (1 - abs(np.log10(planet_radius / 1.0)) / np.log10(2)) *
            (1 - abs(np.log10(features['bulk_density_gcc'] / self.const.rho_earth)) / np.log10(2))
        )
        esi_surface = (
            (1 - abs(np.log10(features['escape_velocity_kms'] / 11.2)) / np.log10(2)) *
            (1 - abs(np.log10(eq_temp / 288)) / np.log10(2))
        )
        features['earth_similarity_index'] = max(0, min(1, (esi_interior * esi_surface) ** 0.25))
        
        # ====================================================================
        # OBSERVATIONAL METRICS (for HWO mission planning)
        # ====================================================================
        
        if stellar_distance is not None:
            # Angular separation (for direct imaging)
            features['angular_separation_mas'] = (
                semi_major_axis * self.const.AU / (stellar_distance * self.const.parsec)
            ) * 206265000  # radians to milliarcseconds
            
            # Transit probability
            features['transit_probability'] = (
                stellar_radius * self.const.R_sun / (semi_major_axis * self.const.AU)
            )
            
            # Transmission spectroscopy metric (TSM)
            H_scale = features['scale_height_n2_km']
            tsm = (H_scale * planet_radius**2 * eq_temp) / (
                planet_mass * stellar_radius**2
            )
            features['transmission_spectroscopy_metric'] = tsm * (10.0 / stellar_distance) ** 2
        else:
            features['angular_separation_mas'] = np.nan
            features['transit_probability'] = np.nan
            features['transmission_spectroscopy_metric'] = np.nan
        
        # ====================================================================
        # COMPOSITE HABITABILITY SCORES
        # ====================================================================
        
        # Multi-factor habitability score
        # Combines: HZ placement, atmospheric retention, stability, temperature
        
        # Temperature score (optimal 250-320K)
        if 250 <= eq_temp <= 320:
            temp_score = 1.0
        elif 200 <= eq_temp <= 400:
            temp_score = 1.0 - abs(eq_temp - 285) / 115
        else:
            temp_score = 0.0
        
        # Atmospheric retention score (already calculated)
        atm_score = features['atmospheric_retention_score']
        
        # Stability score (low eccentricity, not too close to star)
        ecc_score = 1.0 - eccentricity
        distance_score = 1.0 if semi_major_axis > 0.01 else semi_major_axis / 0.01
        stability_score = ecc_score * distance_score
        
        # Overall composite
        features['composite_habitability_score'] = (
            0.35 * hz_score +
            0.25 * temp_score +
            0.20 * atm_score +
            0.20 * stability_score
        )
        
        return features
    
    def features_to_dataframe(
        self,
        feature_dict: Dict[str, float]
    ) -> pd.DataFrame:
        """
        Convert feature dictionary to pandas DataFrame.
        
        Parameters:
        -----------
        feature_dict : dict
            Dictionary from calculate_all_features()
        
        Returns:
        --------
        pd.DataFrame
            Single-row DataFrame with all features
        """
        return pd.DataFrame([feature_dict])
    
    def get_feature_names(self) -> List[str]:
        """
        Get list of all generated feature names.
        
        Returns:
        --------
        list
            List of feature name strings
        """
        # Generate features for dummy data to extract names
        dummy_features = self.calculate_all_features(
            planet_mass=1.0,
            planet_radius=1.0,
            semi_major_axis=1.0,
            orbital_period=365.25,
            stellar_mass=1.0,
            stellar_temp=5778,
            stellar_radius=1.0
        )
        return list(dummy_features.keys())


def create_all_physics_features(
    planet_mass: float,
    planet_radius: float,
    stellar_mass: float,
    stellar_temp: float,
    semi_major_axis: float,
    orbital_period: float,
    eccentricity: float = 0.0,
    stellar_radius: Optional[float] = None,
    stellar_age: Optional[float] = None,
    stellar_distance: Optional[float] = None,
    albedo: float = 0.3,
    greenhouse_factor: float = 1.1
) -> Dict[str, float]:
    """
    Convenience function to generate all physics-based features.
    
    This is the main entry point for feature engineering.
    
    Example:
    --------
    >>> features = create_all_physics_features(
    ...     planet_mass=1.2,
    ...     planet_radius=1.1,
    ...     stellar_mass=0.9,
    ...     stellar_temp=5200,
    ...     semi_major_axis=1.1,
    ...     orbital_period=410,
    ...     stellar_distance=12.5
    ... )
    >>> print(f"Habitability score: {features['composite_habitability_score']:.3f}")
    >>> print(f"In HZ: {bool(features['in_habitable_zone'])}")
    """
    
    engineer = HabitabilityFeatureEngineering()
    return engineer.calculate_all_features(
        planet_mass=planet_mass,
        planet_radius=planet_radius,
        semi_major_axis=semi_major_axis,
        orbital_period=orbital_period,
        eccentricity=eccentricity,
        stellar_mass=stellar_mass,
        stellar_temp=stellar_temp,
        stellar_radius=stellar_radius,
        stellar_age=stellar_age,
        stellar_distance=stellar_distance,
        albedo=albedo,
        greenhouse_factor=greenhouse_factor
    )


# Example usage and testing
if __name__ == "__main__":
    print("=" * 70)
    print("PHYSICS-BASED HABITABILITY FEATURE ENGINEERING")
    print("=" * 70)
    
    # Example 1: Earth
    print("\nExample 1: Earth")
    print("-" * 70)
    earth_features = create_all_physics_features(
        planet_mass=1.0,
        planet_radius=1.0,
        stellar_mass=1.0,
        stellar_temp=5778,
        stellar_radius=1.0,
        semi_major_axis=1.0,
        orbital_period=365.25,
        stellar_distance=0.0000048  # 1 AU in parsecs
    )
    print(f"Equilibrium Temperature: {earth_features['equilibrium_temp_kelvin']:.1f} K")
    print(f"In Habitable Zone: {bool(earth_features['in_habitable_zone'])}")
    print(f"HZ Placement Score: {earth_features['hz_placement_score']:.3f}")
    print(f"Earth Similarity Index: {earth_features['earth_similarity_index']:.3f}")
    print(f"Composite Habitability: {earth_features['composite_habitability_score']:.3f}")
    
    # Example 2: Proxima Centauri b
    print("\nExample 2: Proxima Centauri b (M-dwarf HZ planet)")
    print("-" * 70)
    proxima_b = create_all_physics_features(
        planet_mass=1.17,
        planet_radius=1.1,
        stellar_mass=0.12,
        stellar_temp=3042,
        stellar_radius=0.154,
        semi_major_axis=0.0485,
        orbital_period=11.2,
        stellar_distance=1.3
    )
    print(f"Equilibrium Temperature: {proxima_b['equilibrium_temp_kelvin']:.1f} K")
    print(f"In Habitable Zone: {bool(proxima_b['in_habitable_zone'])}")
    print(f"Tidal Locking Time: {proxima_b['tidal_locking_time_myr']:.1f} Myr")
    print(f"Likely Tidally Locked: {bool(proxima_b['likely_tidally_locked'])}")
    print(f"Composite Habitability: {proxima_b['composite_habitability_score']:.3f}")
    
    print("\n" + "=" * 70)
    print(f"Total features generated: {len(earth_features)}")
    print("=" * 70)
