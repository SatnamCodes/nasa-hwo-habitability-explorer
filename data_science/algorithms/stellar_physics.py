"""
Stellar Physics Calculations

This module implements stellar luminosity, temperature, and habitable zone
calculations based on stellar astrophysics.

References:
- Kasting et al. (1993) - Habitable Zones around Main Sequence Stars
- Kopparapu et al. (2013) - Habitable Zone Calculator
"""

import numpy as np
from typing import Dict, Optional
from .physics_constants import PhysicalConstants


class StellarPhysics:
    """
    Stellar physics calculations for habitability assessment.
    """
    
    def __init__(self):
        self.const = PhysicalConstants()
    
    def calculate_luminosity(
        self, 
        stellar_mass: float, 
        stellar_temp: Optional[float] = None,
        stellar_radius: Optional[float] = None
    ) -> float:
        """
        Calculate stellar luminosity using mass-luminosity relation or Stefan-Boltzmann law.
        
        PHYSICS EXPLANATION:
        
        Method 1 - Stefan-Boltzmann Law (preferred if T and R are known):
        ------------------------------------------------------------------
        L = 4π R² σ T⁴
        
        Where:
        - L: Stellar luminosity (W)
        - R: Stellar radius (m)
        - σ: Stefan-Boltzmann constant = 5.67×10⁻⁸ W m⁻² K⁻⁴
        - T: Effective temperature (K)
        
        This is derived from blackbody radiation integrated over the stellar surface.
        
        Method 2 - Mass-Luminosity Relation (empirical, for main sequence stars):
        -------------------------------------------------------------------------
        L ∝ M^α
        
        Where α depends on mass:
        - M < 0.43 M☉: α ≈ 2.3 (low-mass M-dwarfs, fully convective)
        - 0.43 < M < 2 M☉: α ≈ 4.0 (Sun-like stars, radiative cores)
        - 2 < M < 55 M☉: α ≈ 3.5 (massive stars)
        - M > 55 M☉: α ≈ 1.0 (very massive, radiation pressure dominated)
        
        Physical Reason for Mass Dependence:
        - Low mass: Convective energy transport, less efficient
        - Solar mass: Radiative cores, strong temperature sensitivity
        - High mass: Radiation pressure limits further steepening
        
        Parameters:
        -----------
        stellar_mass : float
            Mass in solar masses (M☉)
        stellar_temp : float, optional
            Effective temperature in Kelvin
        stellar_radius : float, optional
            Radius in solar radii (R☉)
        
        Returns:
        --------
        float
            Luminosity in solar luminosities (L☉)
        
        Example:
        --------
        >>> stellar = StellarPhysics()
        >>> L = stellar.calculate_luminosity(1.0, 5778, 1.0)
        >>> print(f"Solar luminosity: {L:.2f} L☉")  # Should be ~1.0
        """
        
        # Method 1: Stefan-Boltzmann law (most accurate)
        if stellar_temp is not None and stellar_radius is not None:
            R_meters = stellar_radius * self.const.R_sun
            L_watts = 4 * np.pi * (R_meters ** 2) * self.const.sigma_SB * (stellar_temp ** 4)
            return L_watts / self.const.L_sun
        
        # Method 2: Mass-luminosity relation
        if stellar_mass < 0.43:
            alpha = 2.3  # M-dwarfs
        elif stellar_mass < 2.0:
            alpha = 4.0  # Sun-like
        elif stellar_mass < 55:
            alpha = 3.5  # Massive stars
        else:
            alpha = 1.0  # Very massive
        
        return stellar_mass ** alpha
    
    def calculate_habitable_zone_boundaries(
        self,
        stellar_luminosity: float,
        stellar_temp: float
    ) -> Dict[str, float]:
        """
        Calculate habitable zone boundaries using Kopparapu et al. (2013) formulation.
        
        PHYSICS EXPLANATION:
        
        The Habitable Zone (HZ) is the orbital distance range where liquid water
        can exist on a planet's surface under the right atmospheric conditions.
        
        Key Boundaries:
        ---------------
        
        1. INNER EDGE - Recent Venus (Runaway Greenhouse):
           - Incoming stellar flux causes rapid H₂O evaporation
           - Water vapor is a strong greenhouse gas → positive feedback
           - Stratospheric H₂O → UV photodissociation → hydrogen escape
           - Result: Complete water loss (Venus lost its oceans this way)
           - Critical flux: ~1.76 times Earth's solar flux
        
        2. OUTER EDGE - Early Mars (Maximum Greenhouse):
           - CO₂ begins to condense as clouds/ice
           - CO₂ condensation removes greenhouse gas → cooling feedback
           - Even with thick CO₂ atmosphere, surface freezes
           - Critical flux: ~0.32 times Earth's solar flux
        
        Kopparapu Formula:
        ------------------
        
        Distance: d = √(L_star / S_eff)
        
        Where S_eff (effective stellar flux) depends on stellar temperature:
        
        S_eff(T*) = S₀ + a(T* - 5780) + b(T* - 5780)² + c(T* - 5780)³ + d(T* - 5780)⁴
        
        Coefficients determined from 1D climate models with different atmospheres.
        
        Why Temperature Matters:
        ------------------------
        - Hotter stars (F-type): More UV → affects atmospheric chemistry
        - Cooler stars (K/M-type): Different H₂O/CO₂ absorption bands
        - Stellar spectrum changes where planets absorb energy
        
        Parameters:
        -----------
        stellar_luminosity : float
            Luminosity in solar luminosities (L☉)
        stellar_temp : float
            Effective temperature in Kelvin
        
        Returns:
        --------
        dict
            Dictionary containing all HZ boundaries in AU:
            - 'recent_venus': Conservative inner edge
            - 'runaway_greenhouse': Optimistic inner edge
            - 'maximum_greenhouse': Optimistic outer edge
            - 'early_mars': Conservative outer edge
            - 'inner': Conservative inner boundary
            - 'outer': Conservative outer boundary
            - 'center': Geometric mean of conservative boundaries
        
        Reference:
        ----------
        Kopparapu, R. et al. (2013). "Habitable zones around main-sequence stars: 
        new estimates." ApJ, 765, 131.
        """
        
        # Temperature offset from Sun
        T_star = stellar_temp - 5780
        
        # Kopparapu et al. (2013) coefficients for different boundaries
        # S_eff = S₀ + a×ΔT + b×ΔT² + c×ΔT³ + d×ΔT⁴
        coeffs = {
            'recent_venus': {
                'S0': 1.7763,
                'a': 1.4316e-4,
                'b': 2.9875e-9,
                'c': -7.5702e-12,
                'd': -1.1635e-15
            },
            'runaway_greenhouse': {
                'S0': 1.0512,
                'a': 1.3242e-4,
                'b': 1.5418e-8,
                'c': -7.9895e-12,
                'd': -1.8328e-15
            },
            'maximum_greenhouse': {
                'S0': 0.3507,
                'a': 5.9578e-5,
                'b': 1.6707e-9,
                'c': -3.0058e-12,
                'd': -5.1925e-16
            },
            'early_mars': {
                'S0': 0.3207,
                'a': 5.4471e-5,
                'b': 1.5275e-9,
                'c': -2.1709e-12,
                'd': -3.8282e-16
            }
        }
        
        def calculate_S_eff(c):
            """Calculate effective stellar flux using polynomial"""
            return (c['S0'] + 
                   c['a'] * T_star +
                   c['b'] * T_star**2 +
                   c['c'] * T_star**3 +
                   c['d'] * T_star**4)
        
        # Calculate all boundaries
        hz_boundaries = {}
        
        for boundary_name, c in coeffs.items():
            S_eff = calculate_S_eff(c)
            # Distance where planet receives S_eff times Earth's solar flux
            distance_au = np.sqrt(stellar_luminosity / S_eff)
            hz_boundaries[boundary_name] = distance_au
        
        # Add simplified boundary names
        hz_boundaries['inner'] = hz_boundaries['runaway_greenhouse']
        hz_boundaries['outer'] = hz_boundaries['maximum_greenhouse']
        hz_boundaries['center'] = np.sqrt(hz_boundaries['inner'] * hz_boundaries['outer'])
        
        return hz_boundaries
    
    def calculate_main_sequence_lifetime(
        self,
        stellar_mass: float
    ) -> float:
        """
        Estimate main-sequence lifetime (time available for life to develop).
        
        PHYSICS EXPLANATION:
        
        Stars spend most of their lives on the main sequence, fusing hydrogen
        into helium in their cores. The lifetime depends on:
        
        1. Fuel Available: ∝ M (more massive stars have more hydrogen)
        2. Burning Rate: ∝ L (luminosity = rate of energy release)
        
        Therefore:
        τ_MS ∝ M/L
        
        Since L ∝ M^α (mass-luminosity relation):
        τ_MS ∝ M/M^α = M^(1-α)
        
        For Sun: τ_MS ≈ 10¹⁰ years
        
        Results:
        --------
        - M-dwarfs (0.1 M☉): τ ≈ 10 trillion years (exceeds universe age!)
        - K-dwarfs (0.7 M☉): τ ≈ 20 billion years
        - Sun (1.0 M☉): τ ≈ 10 billion years
        - F-stars (1.5 M☉): τ ≈ 3 billion years
        - A-stars (2.5 M☉): τ ≈ 1 billion years (too short for complex life?)
        
        Habitability Implications:
        ---------------------------
        - Life on Earth took ~4 billion years to develop intelligence
        - Stars less massive than Sun may be better for life (longer time)
        - Massive stars evolve too quickly for biological complexity
        
        Parameters:
        -----------
        stellar_mass : float
            Mass in solar masses (M☉)
        
        Returns:
        --------
        float
            Main-sequence lifetime in billions of years (Gyr)
        """
        
        # Determine α based on mass
        if stellar_mass < 0.43:
            alpha = 2.3
        elif stellar_mass < 2.0:
            alpha = 4.0
        else:
            alpha = 3.5
        
        # Lifetime formula: τ = 10^10 × M^(1-α) years
        lifetime_years = 1e10 * stellar_mass ** (1 - alpha)
        
        # Convert to Gyr
        return lifetime_years / 1e9
    
    def estimate_stellar_age_from_rotation(
        self,
        rotation_period: float,
        stellar_mass: float
    ) -> float:
        """
        Estimate stellar age using gyrochronology (rotation-age relation).
        
        PHYSICS EXPLANATION:
        
        Stars spin down over time due to magnetic braking:
        - Stellar wind carries away angular momentum
        - Magnetic field lines connect to wind
        - Result: rotation period increases with age
        
        Gyrochronology Relation (Barnes 2007):
        P = a × age^n × (B-V - c)^b
        
        Simplified:
        age ≈ (P / k)^(1/n) for solar-type stars
        
        Where:
        - P: Rotation period (days)
        - age: Stellar age (Gyr)
        - n ≈ 0.5-0.6 (empirical)
        - k: Color-dependent constant
        
        Parameters:
        -----------
        rotation_period : float
            Rotation period in days
        stellar_mass : float
            Mass in solar masses (for age calibration)
        
        Returns:
        --------
        float
            Estimated age in billions of years (Gyr)
        
        Note:
        -----
        This is approximate and works best for Sun-like stars (0.7-1.3 M☉)
        """
        
        # Simplified gyrochronology for solar-type stars
        # Sun: P ≈ 26 days at age 4.6 Gyr
        
        if 0.7 <= stellar_mass <= 1.3:
            # age ∝ P^2 (approximately)
            age_gyr = 4.6 * (rotation_period / 26.0) ** 2
        else:
            # Less reliable for non-solar-type stars
            age_gyr = 5.0  # Default to 5 Gyr
        
        return np.clip(age_gyr, 0.1, 13.8)  # Universe age limit
