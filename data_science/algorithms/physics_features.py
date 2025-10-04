"""
Physics-Based Habitability Feature Engineering

This module implements advanced astrophysical calculations for exoplanet habitability
assessment based on established research in astrobiology and planetary science.

References:
- Kasting et al. (1993) - Habitable Zones around Main Sequence Stars
- Kopparapu et al. (2013, 2014) - Updated Habitable Zone Boundaries
- Barnes et al. (2015) - Tidal Heating and Habitability
- Seager (2013) - Exoplanet Atmospheres
- Pierrehumbert (2010) - Principles of Planetary Climate
"""

import numpy as np
from typing import Dict, Optional, Tuple
from dataclasses import dataclass


# Physical Constants (SI units unless noted)
@dataclass
class PhysicalConstants:
    """Universal physical constants for habitability calculations"""
    
    # Fundamental constants
    G = 6.67430e-11  # Gravitational constant (m^3 kg^-1 s^-2)
    k_B = 1.380649e-23  # Boltzmann constant (J/K)
    M_H = 1.6738e-27  # Mass of hydrogen atom (kg)
    sigma_SB = 5.670374419e-8  # Stefan-Boltzmann constant (W m^-2 K^-4)
    AU = 1.495978707e11  # Astronomical Unit (m)
    
    # Solar/Earth reference values
    L_sun = 3.828e26  # Solar luminosity (W)
    M_sun = 1.989e30  # Solar mass (kg)
    R_sun = 6.96e8  # Solar radius (m)
    T_sun = 5778  # Solar effective temperature (K)
    
    M_earth = 5.972e24  # Earth mass (kg)
    R_earth = 6.371e6  # Earth radius (m)
    g_earth = 9.81  # Earth surface gravity (m/s^2)
    
    M_jupiter = 1.898e27  # Jupiter mass (kg)
    R_jupiter = 6.9911e7  # Jupiter radius (m)


class HabitabilityPhysics:
    """
    Advanced physics-based feature engineering for exoplanet habitability assessment.
    
    Each method implements peer-reviewed astrophysical formulas with detailed
    explanations of the underlying physics.
    """
    
    def __init__(self):
        self.const = PhysicalConstants()
    
    # ============================================================================
    # 1. STELLAR FLUX AND TEMPERATURE CALCULATIONS
    # ============================================================================
    
    def calculate_stellar_luminosity(
        self, 
        stellar_mass: float, 
        stellar_temp: Optional[float] = None,
        stellar_radius: Optional[float] = None
    ) -> float:
        """
        Calculate stellar luminosity using multiple methods.
        
        Physics Explanation:
        - For main-sequence stars, luminosity follows a power law: L ∝ M^α
        - α varies by mass: ~4 for M < 0.43 M_sun, ~3.5 for higher masses
        - Alternative: Stefan-Boltzmann law if radius and temperature known
        
        Parameters:
        - stellar_mass: Mass in solar masses
        - stellar_temp: Effective temperature in Kelvin (optional)
        - stellar_radius: Radius in solar radii (optional)
        
        Returns:
        - Luminosity in solar luminosities
        """
        
        # Method 1: Stefan-Boltzmann law (most accurate if T and R known)
        if stellar_temp is not None and stellar_radius is not None:
            # L = 4π R² σ T⁴
            R_meters = stellar_radius * self.const.R_sun
            L_watts = 4 * np.pi * (R_meters ** 2) * self.const.sigma_SB * (stellar_temp ** 4)
            return L_watts / self.const.L_sun
        
        # Method 2: Mass-luminosity relation (main sequence stars)
        if stellar_mass < 0.43:
            # Low-mass stars (M dwarfs)
            alpha = 2.3
        elif stellar_mass < 2.0:
            # Solar-type stars
            alpha = 4.0
        elif stellar_mass < 55:
            # High-mass stars
            alpha = 3.5
        else:
            # Very massive stars
            alpha = 1.0
        
        return stellar_mass ** alpha
    
    def calculate_equilibrium_temperature(
        self,
        stellar_luminosity: float,
        semi_major_axis: float,
        albedo: float = 0.3,
        greenhouse_factor: float = 1.1
    ) -> float:
        """
        Calculate planet equilibrium temperature considering energy balance.
        
        Physics Explanation:
        The equilibrium temperature is derived from energy balance:
        - Incoming stellar flux: F_in = L_star / (4π a²) × (1 - A)
        - Outgoing thermal radiation: F_out = σ T_eq⁴
        - At equilibrium: F_in = F_out
        
        Formula: T_eq = [(L_star × (1-A)) / (16 π σ a²)]^(1/4) × f_greenhouse
        
        Where:
        - L_star: Stellar luminosity
        - a: Semi-major axis (orbital distance)
        - A: Bond albedo (fraction of light reflected)
        - σ: Stefan-Boltzmann constant
        - f_greenhouse: Greenhouse warming factor (1.0 = no atmosphere)
        
        Parameters:
        - stellar_luminosity: In solar luminosities
        - semi_major_axis: In AU
        - albedo: Bond albedo (0-1), default 0.3 (Earth-like)
        - greenhouse_factor: Atmospheric warming factor, default 1.1
        
        Returns:
        - Equilibrium temperature in Kelvin
        """
        
        # Convert to SI units
        L_watts = stellar_luminosity * self.const.L_sun
        a_meters = semi_major_axis * self.const.AU
        
        # Energy balance equation
        T_eq = ((L_watts * (1 - albedo)) / (16 * np.pi * self.const.sigma_SB * a_meters**2)) ** 0.25
        
        # Apply greenhouse warming
        T_effective = T_eq * greenhouse_factor
        
        return T_effective
    
    def calculate_habitable_zone_boundaries(
        self,
        stellar_luminosity: float,
        stellar_temp: float
    ) -> Dict[str, float]:
        """
        Calculate habitable zone boundaries using Kopparapu et al. (2013) formulation.
        
        Physics Explanation:
        The habitable zone (HZ) is the region where liquid water can exist on a
        planet's surface. Boundaries depend on:
        
        1. Recent Venus (inner edge): Runaway greenhouse threshold
           - Water vapor greenhouse effect becomes catastrophic
           - H2O photodissociation and hydrogen escape
        
        2. Early Mars (outer edge): Maximum greenhouse effect
           - CO2 condensation limits greenhouse warming
           - Carbonate-silicate cycle breakdown
        
        Kopparapu Formula:
        d = √(L_star / S_eff)
        
        Where S_eff (effective stellar flux) depends on stellar temperature:
        S_eff(T_star) = S_eff(sun) + a(T_star - 5780) + b(T_star - 5780)² + ...
        
        Parameters:
        - stellar_luminosity: In solar luminosities
        - stellar_temp: Effective temperature in Kelvin
        
        Returns:
        - Dictionary with inner, optimistic inner, conservative outer, and outer boundaries (AU)
        """
        
        # Temperature offset from Sun
        T_star = stellar_temp - 5780
        
        # Kopparapu et al. (2013) coefficients
        # S_eff values in solar flux units
        coeffs = {
            'recent_venus': {
                'S0': 1.7763, 'a': 1.4316e-4, 'b': 2.9875e-9, 'c': -7.5702e-12, 'd': -1.1635e-15
            },
            'runaway_greenhouse': {
                'S0': 1.0512, 'a': 1.3242e-4, 'b': 1.5418e-8, 'c': -7.9895e-12, 'd': -1.8328e-15
            },
            'maximum_greenhouse': {
                'S0': 0.3507, 'a': 5.9578e-5, 'b': 1.6707e-9, 'c': -3.0058e-12, 'd': -5.1925e-16
            },
            'early_mars': {
                'S0': 0.3207, 'a': 5.4471e-5, 'b': 1.5275e-9, 'c': -2.1709e-12, 'd': -3.8282e-16
            }
        }
        
        def calculate_S_eff(coeffs_dict):
            """Calculate effective stellar flux"""
            return (coeffs_dict['S0'] + 
                   coeffs_dict['a'] * T_star +
                   coeffs_dict['b'] * T_star**2 +
                   coeffs_dict['c'] * T_star**3 +
                   coeffs_dict['d'] * T_star**4)
        
        # Calculate boundaries
        hz_boundaries = {}
        
        for boundary_name, c in coeffs.items():
            S_eff = calculate_S_eff(c)
            distance_au = np.sqrt(stellar_luminosity / S_eff)
            hz_boundaries[boundary_name] = distance_au
        
        # Add conservative and optimistic definitions
        hz_boundaries['inner_conservative'] = hz_boundaries['runaway_greenhouse']
        hz_boundaries['inner_optimistic'] = hz_boundaries['recent_venus']
        hz_boundaries['outer_conservative'] = hz_boundaries['maximum_greenhouse']
        hz_boundaries['outer_optimistic'] = hz_boundaries['early_mars']
        
        # Classical definition (geometric mean)
        hz_boundaries['center'] = np.sqrt(
            hz_boundaries['inner_conservative'] * hz_boundaries['outer_conservative']
        )
        
        return hz_boundaries
    
    # ============================================================================
    # 2. ATMOSPHERIC RETENTION AND ESCAPE
    # ============================================================================
    
    def calculate_surface_gravity(
        self,
        planet_mass: float,
        planet_radius: float
    ) -> float:
        """
        Calculate surface gravity.
        
        Physics Explanation:
        Newton's law of gravitation at the surface:
        g = G M / R²
        
        Where:
        - G: Gravitational constant
        - M: Planet mass
        - R: Planet radius
        
        Surface gravity determines:
        - Atmospheric retention capability
        - Atmospheric scale height
        - Tectonic activity potential
        
        Parameters:
        - planet_mass: In Earth masses
        - planet_radius: In Earth radii
        
        Returns:
        - Surface gravity in m/s² (Earth = 9.81 m/s²)
        """
        
        M_kg = planet_mass * self.const.M_earth
        R_m = planet_radius * self.const.R_earth
        
        g = self.const.G * M_kg / (R_m ** 2)
        
        return g
    
    def calculate_escape_velocity(
        self,
        planet_mass: float,
        planet_radius: float
    ) -> float:
        """
        Calculate escape velocity.
        
        Physics Explanation:
        Energy required to escape gravitational well:
        v_esc = √(2GM/R)
        
        Derived from kinetic energy = gravitational potential energy:
        (1/2)mv² = GMm/R
        
        Escape velocity determines atmospheric retention:
        - Higher v_esc → better atmospheric retention
        - Compare to thermal velocity of atmospheric molecules
        
        Parameters:
        - planet_mass: In Earth masses
        - planet_radius: In Earth radii
        
        Returns:
        - Escape velocity in km/s (Earth = 11.2 km/s)
        """
        
        M_kg = planet_mass * self.const.M_earth
        R_m = planet_radius * self.const.R_earth
        
        v_esc = np.sqrt(2 * self.const.G * M_kg / R_m)
        
        return v_esc / 1000  # Convert to km/s
    
    def calculate_jeans_escape_parameter(
        self,
        planet_mass: float,
        planet_radius: float,
        equilibrium_temp: float,
        molecular_mass: float = 2.0  # H2 by default
    ) -> float:
        """
        Calculate Jeans escape parameter for atmospheric loss assessment.
        
        Physics Explanation:
        The Jeans parameter λ determines whether a molecule can escape:
        
        λ = (GMm) / (R k_B T)
        
        Where:
        - G: Gravitational constant
        - M: Planet mass
        - m: Molecular mass
        - R: Planet radius
        - k_B: Boltzmann constant
        - T: Exosphere temperature
        
        Physical Interpretation:
        - λ >> 1: Gravitational binding energy >> thermal energy → Good retention
        - λ < 3: Significant atmospheric escape (Jeans escape)
        - λ > 10: Negligible escape over Gyr timescales
        
        Rule of thumb:
        - λ > 15: Excellent retention (Earth: H₂O, λ ≈ 20)
        - λ = 6-15: Moderate retention
        - λ < 6: Poor retention, rapid escape
        
        Parameters:
        - planet_mass: In Earth masses
        - planet_radius: In Earth radii
        - equilibrium_temp: In Kelvin
        - molecular_mass: In atomic mass units (H2=2, H2O=18, N2=28)
        
        Returns:
        - Jeans parameter (dimensionless)
        """
        
        M_kg = planet_mass * self.const.M_earth
        R_m = planet_radius * self.const.R_earth
        m_kg = molecular_mass * self.const.M_H
        
        # Jeans parameter
        lambda_jeans = (self.const.G * M_kg * m_kg) / (R_m * self.const.k_B * equilibrium_temp)
        
        return lambda_jeans
    
    def calculate_atmospheric_scale_height(
        self,
        equilibrium_temp: float,
        planet_mass: float,
        planet_radius: float,
        mean_molecular_weight: float = 28.97  # Earth atmosphere (mostly N2)
    ) -> float:
        """
        Calculate atmospheric scale height.
        
        Physics Explanation:
        Scale height H is the altitude over which atmospheric pressure decreases by e:
        
        H = (k_B T) / (m g)
        
        Where:
        - k_B: Boltzmann constant
        - T: Temperature
        - m: Mean molecular mass
        - g: Surface gravity
        
        Derived from hydrostatic equilibrium:
        dP/dz = -ρg → P(z) = P(0) exp(-z/H)
        
        Physical Significance:
        - Larger H → more extended atmosphere → easier to characterize spectroscopically
        - Earth: H ≈ 8.5 km
        - Hot Jupiters: H ≈ 500+ km (easier to study)
        
        Parameters:
        - equilibrium_temp: In Kelvin
        - planet_mass: In Earth masses
        - planet_radius: In Earth radii
        - mean_molecular_weight: In atomic mass units
        
        Returns:
        - Scale height in kilometers
        """
        
        g = self.calculate_surface_gravity(planet_mass, planet_radius)
        m_kg = mean_molecular_weight * self.const.M_H
        
        H = (self.const.k_B * equilibrium_temp) / (m_kg * g)
        
        return H / 1000  # Convert to km
    
    # ============================================================================
    # 3. ORBITAL DYNAMICS AND TIDAL EFFECTS
    # ============================================================================
    
    def calculate_tidal_heating(
        self,
        planet_mass: float,
        planet_radius: float,
        stellar_mass: float,
        semi_major_axis: float,
        eccentricity: float,
        orbital_period: float
    ) -> float:
        """
        Calculate tidal heating rate (important for M-dwarf habitable zone planets).
        
        Physics Explanation:
        Tidal heating occurs due to periodic deformation from varying tidal forces.
        
        Formula (Peale et al. 1979, Barnes et al. 2013):
        
        dE/dt = -(21/2) × (k₂/Q) × (n⁵ R⁵ e²) / G
        
        Where:
        - k₂: Love number (tidal deformability, ~0.3 for rocky planets)
        - Q: Tidal dissipation factor (~100 for rocky planets)
        - n: Mean motion (orbital frequency) = 2π/P
        - R: Planet radius
        - e: Orbital eccentricity
        - G: Gravitational constant
        
        Physical Significance:
        - Tidal heating can maintain subsurface oceans (Europa, Enceladus)
        - Excessive heating → runaway greenhouse (e.g., Io)
        - Important for planets in circular orbits around M-dwarfs (tidal locking)
        
        Parameters:
        - planet_mass: In Earth masses
        - planet_radius: In Earth radii
        - stellar_mass: In solar masses
        - semi_major_axis: In AU
        - eccentricity: Orbital eccentricity (0-1)
        - orbital_period: In days
        
        Returns:
        - Tidal heating rate in W/kg (Earth internal heating ≈ 2.5e-11 W/kg)
        """
        
        # Tidal parameters
        k2 = 0.3  # Love number (rocky planet)
        Q = 100  # Tidal dissipation factor
        
        # Convert to SI
        M_p = planet_mass * self.const.M_earth
        R = planet_radius * self.const.R_earth
        M_s = stellar_mass * self.const.M_sun
        a = semi_major_axis * self.const.AU
        P_seconds = orbital_period * 86400
        
        # Mean motion
        n = 2 * np.pi / P_seconds
        
        # Tidal heating formula
        if eccentricity > 0.001:  # Eccentric orbit
            E_dot = (21/2) * (k2/Q) * (self.const.G * M_s**2 * R**5 * n**5 * eccentricity**2) / (a**6)
        else:  # Circular orbit - use equilibrium tide formula
            E_dot = 0.0
        
        # Specific heating rate (per unit mass)
        heating_rate = E_dot / M_p if M_p > 0 else 0.0
        
        return heating_rate
    
    def calculate_hill_sphere_radius(
        self,
        planet_mass: float,
        stellar_mass: float,
        semi_major_axis: float
    ) -> float:
        """
        Calculate Hill sphere radius (gravitational sphere of influence).
        
        Physics Explanation:
        The Hill sphere defines the region where a planet's gravity dominates
        over the star's tidal forces.
        
        Formula:
        r_H = a × (M_p / (3M_s))^(1/3)
        
        Where:
        - a: Semi-major axis
        - M_p: Planet mass
        - M_s: Stellar mass
        
        Physical Significance:
        - Determines maximum stable satellite orbits
        - Moon stability: Moon orbit < r_H/3 for stability
        - Atmospheric retention: exosphere extends to ~r_H
        
        Parameters:
        - planet_mass: In Earth masses
        - stellar_mass: In solar masses
        - semi_major_axis: In AU
        
        Returns:
        - Hill sphere radius in AU (Earth ≈ 0.01 AU)
        """
        
        M_p = planet_mass * self.const.M_earth
        M_s = stellar_mass * self.const.M_sun
        a = semi_major_axis * self.const.AU
        
        r_H = a * (M_p / (3 * M_s)) ** (1/3)
        
        return r_H / self.const.AU
    
    def calculate_orbital_velocity(
        self,
        stellar_mass: float,
        semi_major_axis: float
    ) -> float:
        """
        Calculate orbital velocity (Kepler's laws).
        
        Physics Explanation:
        From vis-viva equation for circular orbits:
        v = √(GM/a)
        
        Parameters:
        - stellar_mass: In solar masses
        - semi_major_axis: In AU
        
        Returns:
        - Orbital velocity in km/s (Earth ≈ 29.8 km/s)
        """
        
        M_s = stellar_mass * self.const.M_sun
        a = semi_major_axis * self.const.AU
        
        v = np.sqrt(self.const.G * M_s / a)
        
        return v / 1000
    
    # ============================================================================
    # 4. PLANET COMPOSITION AND STRUCTURE
    # ============================================================================
    
    def calculate_bulk_density(
        self,
        planet_mass: float,
        planet_radius: float
    ) -> float:
        """
        Calculate bulk density.
        
        Physics Explanation:
        ρ = M / V = M / (4/3 π R³)
        
        Density indicates composition:
        - ρ > 5 g/cm³: Iron-rich (Mercury: 5.4)
        - ρ ≈ 5.5 g/cm³: Earth-like (rocky)
        - ρ ≈ 3-4 g/cm³: Water-rich or large iron core
        - ρ < 2 g/cm³: Gas dwarf (significant H/He envelope)
        - ρ < 1.5 g/cm³: Gas giant (Jupiter: 1.3)
        
        Parameters:
        - planet_mass: In Earth masses
        - planet_radius: In Earth radii
        
        Returns:
        - Bulk density in g/cm³ (Earth = 5.51 g/cm³)
        """
        
        M_kg = planet_mass * self.const.M_earth
        R_m = planet_radius * self.const.R_earth
        
        volume = (4/3) * np.pi * R_m**3
        density_kg_m3 = M_kg / volume if volume > 0 else 0
        
        return density_kg_m3 / 1000  # Convert to g/cm³
    
    def estimate_core_mass_fraction(
        self,
        planet_mass: float,
        planet_radius: float
    ) -> float:
        """
        Estimate iron core mass fraction from mass-radius relationship.
        
        Physics Explanation:
        Using Zeng et al. (2016) mass-radius relations for rocky planets:
        - Pure iron: R ∝ M^0.26
        - Earth-like (32.5% Fe): R ∝ M^0.27
        - Pure silicate: R ∝ M^0.27
        
        We interpolate to estimate core fraction based on observed M and R.
        
        Parameters:
        - planet_mass: In Earth masses
        - planet_radius: In Earth radii
        
        Returns:
        - Core mass fraction (0-1, Earth ≈ 0.325)
        """
        
        # Reference mass-radius relations (Zeng et al. 2016)
        # R = C × M^α for different compositions
        
        # Calculate expected radii for different compositions
        R_pure_iron = 0.84 * planet_mass**0.26
        R_earth_like = 1.0 * planet_mass**0.27
        R_pure_silicate = 1.07 * planet_mass**0.27
        
        # Interpolate core fraction
        if planet_radius <= R_pure_iron:
            # Denser than pure iron (unlikely, but possible measurement error)
            core_fraction = 1.0
        elif planet_radius >= R_pure_silicate:
            # Less dense than pure silicate (water world or gas dwarf)
            core_fraction = 0.0
        else:
            # Interpolate between iron and silicate
            if planet_radius < R_earth_like:
                # Iron-rich
                core_fraction = 0.325 + (R_earth_like - planet_radius) / (R_earth_like - R_pure_iron) * (1.0 - 0.325)
            else:
                # Silicate-rich
                core_fraction = 0.325 * (R_pure_silicate - planet_radius) / (R_pure_silicate - R_earth_like)
        
        return np.clip(core_fraction, 0.0, 1.0)
    
    # ============================================================================
    # 5. STELLAR ACTIVITY AND HABITABILITY
    # ============================================================================
    
    def calculate_stellar_habitable_lifetime(
        self,
        stellar_mass: float
    ) -> float:
        """
        Estimate main-sequence lifetime (time available for life to develop).
        
        Physics Explanation:
        Main-sequence lifetime is determined by nuclear fuel and burning rate:
        
        τ_MS = (M/L) × 10^10 years
        
        Where L ∝ M^α (α ≈ 3.5 for solar-type stars)
        
        Therefore: τ_MS ≈ 10^10 × M^(1-α) years
        
        Physical Significance:
        - M-dwarfs (0.1 M_sun): τ ≈ 10 trillion years (longer than universe age)
        - Sun (1.0 M_sun): τ ≈ 10 billion years
        - A-stars (2 M_sun): τ ≈ 1 billion years (short for complex life)
        
        Parameters:
        - stellar_mass: In solar masses
        
        Returns:
        - Main-sequence lifetime in billions of years
        """
        
        if stellar_mass < 0.43:
            alpha = 2.3
        elif stellar_mass < 2.0:
            alpha = 4.0
        else:
            alpha = 3.5
        
        lifetime_years = 1e10 * stellar_mass ** (1 - alpha)
        
        return lifetime_years / 1e9  # Convert to Gyr
    
    def estimate_xray_flux_age_dependence(
        self,
        stellar_mass: float,
        stellar_age: Optional[float] = None
    ) -> float:
        """
        Estimate X-ray/UV flux affecting atmospheric photochemistry.
        
        Physics Explanation:
        High-energy radiation affects habitability through:
        1. Water photodissociation (UV) → hydrogen escape
        2. Ozone layer destruction
        3. Surface UV damage to biomolecules
        
        XUV flux evolution (Ribas et al. 2005):
        F_XUV(t) ∝ t^(-1.23) for t < 1 Gyr (saturated)
        F_XUV(t) ∝ t^(-1.23) for t > 1 Gyr
        
        M-dwarfs have higher F_XUV/F_bol ratios → greater challenge
        
        Parameters:
        - stellar_mass: In solar masses
        - stellar_age: In billions of years (default: 5 Gyr)
        
        Returns:
        - Relative XUV flux (Sun today = 1.0)
        """
        
        if stellar_age is None:
            stellar_age = 5.0  # Assume mid-life star
        
        # XUV flux evolution (saturated for young stars)
        if stellar_age < 0.1:
            F_xuv_relative = 100  # Very young, saturated
        else:
            F_xuv_relative = (stellar_age / 4.6) ** (-1.23)
        
        # M-dwarfs have relatively higher XUV
        if stellar_mass < 0.6:
            xuv_enhancement = 2.0 / stellar_mass
        else:
            xuv_enhancement = 1.0
        
        return F_xuv_relative * xuv_enhancement
    
    # ============================================================================
    # 6. HABITABILITY INDICES
    # ============================================================================
    
    def calculate_earth_similarity_index(
        self,
        planet_radius: float,
        planet_mass: float,
        equilibrium_temp: float,
        escape_velocity: float
    ) -> float:
        """
        Calculate Earth Similarity Index (ESI).
        
        Physics Explanation:
        ESI quantifies similarity to Earth using exoplanet properties:
        
        ESI = ∏ [1 - |log(x_i / x_Earth)|] / n
        
        Where x_i are properties: radius, density, escape velocity, temperature
        
        ESI ranges from 0 (completely dissimilar) to 1 (Earth twin)
        
        Reference: Schulze-Makuch et al. (2011)
        
        Parameters:
        - planet_radius: In Earth radii
        - planet_mass: In Earth masses
        - equilibrium_temp: In Kelvin
        - escape_velocity: In km/s
        
        Returns:
        - ESI value (0-1)
        """
        
        # Earth reference values
        R_earth_ref = 1.0
        M_earth_ref = 1.0
        T_earth = 288  # Earth mean temperature
        v_esc_earth = 11.2
        
        # Calculate density
        rho = self.calculate_bulk_density(planet_mass, planet_radius)
        rho_earth = 5.51
        
        # Geometric mean of property similarities
        esi_interior = (
            (1 - abs(np.log10(planet_radius / R_earth_ref)) / np.log10(2)) *
            (1 - abs(np.log10(rho / rho_earth)) / np.log10(2))
        )
        
        esi_surface = (
            (1 - abs(np.log10(escape_velocity / v_esc_earth)) / np.log10(2)) *
            (1 - abs(np.log10(equilibrium_temp / T_earth)) / np.log10(2))
        )
        
        # Geometric mean
        ESI = (esi_interior * esi_surface) ** 0.25
        
        return np.clip(ESI, 0.0, 1.0)
    
    def calculate_habitable_zone_distance_score(
        self,
        semi_major_axis: float,
        hz_inner: float,
        hz_outer: float
    ) -> float:
        """
        Score planet location within habitable zone.
        
        Physics Explanation:
        - Score = 1.0 at HZ center
        - Score decreases toward inner/outer edges
        - Score = 0 outside HZ
        
        Parameters:
        - semi_major_axis: Planet orbital distance (AU)
        - hz_inner: Inner HZ boundary (AU)
        - hz_outer: Outer HZ boundary (AU)
        
        Returns:
        - HZ distance score (0-1)
        """
        
        hz_center = np.sqrt(hz_inner * hz_outer)
        hz_width = hz_outer - hz_inner
        
        if semi_major_axis < hz_inner or semi_major_axis > hz_outer:
            return 0.0
        
        # Gaussian-like scoring centered on HZ middle
        distance_from_center = abs(semi_major_axis - hz_center)
        score = np.exp(-(distance_from_center / (hz_width / 4)) ** 2)
        
        return score
    
    def calculate_tidal_locking_timescale(
        self,
        planet_mass: float,
        planet_radius: float,
        stellar_mass: float,
        semi_major_axis: float,
        rotation_period: Optional[float] = None
    ) -> float:
        """
        Estimate timescale for tidal locking (important for M-dwarf HZ planets).
        
        Physics Explanation:
        Tidal locking timescale (Peale, 1977):
        
        τ_lock ≈ (ωR²Q) / (3GM_star²k₂a⁶)
        
        Where:
        - ω: Initial rotation rate
        - Q: Tidal dissipation factor
        - k₂: Love number
        - a: Semi-major axis
        
        Physical Significance:
        - Tidally locked planets have permanent day/night sides
        - Affects atmospheric circulation and habitability
        - M-dwarf HZ planets typically tidally locked
        
        Parameters:
        - planet_mass: In Earth masses
        - planet_radius: In Earth radii
        - stellar_mass: In solar masses
        - semi_major_axis: In AU
        - rotation_period: Initial rotation in hours (default: 24)
        
        Returns:
        - Tidal locking timescale in millions of years
        """
        
        if rotation_period is None:
            rotation_period = 24.0  # Earth-like
        
        # Convert to SI
        R = planet_radius * self.const.R_earth
        M_s = stellar_mass * self.const.M_sun
        a = semi_major_axis * self.const.AU
        omega = 2 * np.pi / (rotation_period * 3600)
        
        # Tidal parameters
        Q = 100
        k2 = 0.3
        
        # Tidal locking timescale
        numerator = omega * R**2 * Q
        denominator = 3 * self.const.G * M_s**2 * k2 * a**6
        
        tau_lock_seconds = numerator / denominator if denominator > 0 else 1e20
        
        # Convert to millions of years
        tau_lock_myr = tau_lock_seconds / (365.25 * 86400 * 1e6)
        
        return tau_lock_myr
    
    # ============================================================================
    # 7. OBSERVATIONAL CHARACTERIZABILITY
    # ============================================================================
    
    def calculate_transit_signal_to_noise(
        self,
        planet_radius: float,
        stellar_radius: float,
        stellar_distance: float,
        stellar_magnitude: Optional[float] = None
    ) -> float:
        """
        Estimate transit signal strength for observability assessment.
        
        Physics Explanation:
        Transit depth:
        δ = (R_p / R_star)²
        
        Signal-to-noise depends on:
        - Transit depth (larger planets → stronger signal)
        - Stellar brightness (closer, brighter stars → better S/N)
        - Photometric precision
        
        Parameters:
        - planet_radius: In Earth radii
        - stellar_radius: In solar radii
        - stellar_distance: In parsecs
        - stellar_magnitude: Apparent V magnitude (optional)
        
        Returns:
        - Relative transit signal metric (arbitrary units)
        """
        
        # Transit depth
        R_p_earth = planet_radius * self.const.R_earth
        R_star_sun = stellar_radius * self.const.R_sun
        
        transit_depth = (R_p_earth / R_star_sun) ** 2
        
        # Distance penalty
        distance_factor = 1.0 / stellar_distance**2
        
        # Signal metric (simplified)
        signal = transit_depth * distance_factor * 1e6  # Scaled to reasonable range
        
        return signal
    
    def calculate_transmission_spectroscopy_metric(
        self,
        planet_radius: float,
        planet_mass: float,
        equilibrium_temp: float,
        stellar_radius: float,
        stellar_distance: float
    ) -> float:
        """
        Calculate Transmission Spectroscopy Metric (TSM) for atmospheric characterizability.
        
        Physics Explanation:
        TSM (Kempton et al. 2018) predicts James Webb Space Telescope observation time:
        
        TSM = (Scale_Height × R_p² × T_eq) / (M_p × R_star²) × 10^(-0.2 × Magnitude)
        
        Higher TSM → easier atmospheric characterization
        
        Parameters:
        - planet_radius: In Earth radii
        - planet_mass: In Earth masses
        - equilibrium_temp: In Kelvin
        - stellar_radius: In solar radii
        - stellar_distance: In parsecs
        
        Returns:
        - TSM value (higher = better for spectroscopy)
        """
        
        # Calculate scale height
        H = self.calculate_atmospheric_scale_height(
            equilibrium_temp, planet_mass, planet_radius
        )
        
        # Convert to Earth units
        H_earth_radii = (H * 1000) / self.const.R_earth
        
        # TSM formula (simplified, without magnitude)
        tsm = (H_earth_radii * planet_radius**2 * equilibrium_temp) / (
            planet_mass * stellar_radius**2
        )
        
        # Distance penalty
        tsm *= (10.0 / stellar_distance) ** 2
        
        return tsm


def create_physics_feature_vector(
    planet_mass: float,
    planet_radius: float,
    stellar_mass: float,
    stellar_temp: float,
    stellar_radius: float,
    stellar_distance: float,
    semi_major_axis: float,
    orbital_period: float,
    eccentricity: float = 0.0,
    stellar_age: Optional[float] = None
) -> Dict[str, float]:
    """
    Generate comprehensive physics-based feature vector for ML model.
    
    This function calculates 25+ advanced astrophysical features that capture
    the physical processes relevant to planetary habitability.
    
    Returns:
    - Dictionary with all calculated features and their values
    """
    
    physics = HabitabilityPhysics()
    features = {}
    
    # Basic input features
    features['planet_mass'] = planet_mass
    features['planet_radius'] = planet_radius
    features['stellar_mass'] = stellar_mass
    features['stellar_temp'] = stellar_temp
    features['stellar_radius'] = stellar_radius
    features['stellar_distance'] = stellar_distance
    features['semi_major_axis'] = semi_major_axis
    features['orbital_period'] = orbital_period
    features['eccentricity'] = eccentricity
    
    # Stellar properties
    features['stellar_luminosity'] = physics.calculate_stellar_luminosity(
        stellar_mass, stellar_temp, stellar_radius
    )
    features['stellar_lifetime'] = physics.calculate_stellar_habitable_lifetime(stellar_mass)
    features['xuv_flux'] = physics.estimate_xray_flux_age_dependence(stellar_mass, stellar_age)
    
    # Temperature and energy
    features['equilibrium_temp'] = physics.calculate_equilibrium_temperature(
        features['stellar_luminosity'], semi_major_axis
    )
    
    # Habitable zone analysis
    hz = physics.calculate_habitable_zone_boundaries(
        features['stellar_luminosity'], stellar_temp
    )
    features['hz_inner'] = hz['inner_conservative']
    features['hz_outer'] = hz['outer_conservative']
    features['hz_center'] = hz['center']
    features['hz_distance_score'] = physics.calculate_habitable_zone_distance_score(
        semi_major_axis, hz['inner_conservative'], hz['outer_conservative']
    )
    features['hz_distance_ratio'] = semi_major_axis / hz['center']
    
    # Atmospheric retention
    features['surface_gravity'] = physics.calculate_surface_gravity(planet_mass, planet_radius)
    features['escape_velocity'] = physics.calculate_escape_velocity(planet_mass, planet_radius)
    features['jeans_parameter_h2'] = physics.calculate_jeans_escape_parameter(
        planet_mass, planet_radius, features['equilibrium_temp'], molecular_mass=2.0
    )
    features['jeans_parameter_h2o'] = physics.calculate_jeans_escape_parameter(
        planet_mass, planet_radius, features['equilibrium_temp'], molecular_mass=18.0
    )
    features['scale_height'] = physics.calculate_atmospheric_scale_height(
        features['equilibrium_temp'], planet_mass, planet_radius
    )
    
    # Orbital dynamics
    features['orbital_velocity'] = physics.calculate_orbital_velocity(stellar_mass, semi_major_axis)
    features['hill_radius'] = physics.calculate_hill_sphere_radius(
        planet_mass, stellar_mass, semi_major_axis
    )
    features['tidal_heating'] = physics.calculate_tidal_heating(
        planet_mass, planet_radius, stellar_mass, semi_major_axis, 
        eccentricity, orbital_period
    )
    features['tidal_locking_time'] = physics.calculate_tidal_locking_timescale(
        planet_mass, planet_radius, stellar_mass, semi_major_axis
    )
    
    # Composition
    features['bulk_density'] = physics.calculate_bulk_density(planet_mass, planet_radius)
    features['core_mass_fraction'] = physics.estimate_core_mass_fraction(planet_mass, planet_radius)
    
    # Habitability indices
    features['earth_similarity_index'] = physics.calculate_earth_similarity_index(
        planet_radius, planet_mass, features['equilibrium_temp'], features['escape_velocity']
    )
    
    # Observability
    features['transit_signal'] = physics.calculate_transit_signal_to_noise(
        planet_radius, stellar_radius, stellar_distance
    )
    features['transmission_spectroscopy_metric'] = physics.calculate_transmission_spectroscopy_metric(
        planet_radius, planet_mass, features['equilibrium_temp'], 
        stellar_radius, stellar_distance
    )
    
    return features
