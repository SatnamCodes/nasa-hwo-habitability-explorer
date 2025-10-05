"""
Planetary Atmospheric Physics

This module implements atmospheric retention, escape, and scale height calculations
critical for assessing planetary habitability.

References:
- Catling & Kasting (2017) - Atmospheric Evolution on Inhabited and Lifeless Worlds
- Zahnle & Catling (2017) - The Cosmic Shoreline
"""

import numpy as np
from typing import Optional

# Try relative imports first, fall back to absolute
try:
    from .physics_constants import PhysicalConstants
except ImportError:
    from physics_constants import PhysicalConstants


class AtmosphericPhysics:
    """
    Atmospheric physics calculations for habitability assessment.
    """
    
    def __init__(self):
        self.const = PhysicalConstants()
    
    def calculate_surface_gravity(
        self,
        planet_mass: float,
        planet_radius: float
    ) -> float:
        """
        Calculate surface gravity.
        
        PHYSICS EXPLANATION:
        
        From Newton's law of universal gravitation at the surface:
        
        F = G M m / R²
        
        Surface gravity is force per unit mass:
        g = F/m = G M / R²
        
        Where:
        - G: Gravitational constant = 6.674×10⁻¹¹ m³ kg⁻¹ s⁻²
        - M: Planet mass (kg)
        - R: Planet radius (m)
        
        Physical Significance for Habitability:
        ----------------------------------------
        
        1. Atmospheric Retention:
           - Higher g → harder for gas molecules to escape
           - Low g planets (like Mars) lose atmospheres easily
        
        2. Surface Conditions:
           - Affects atmospheric pressure at surface
           - P(surface) ∝ g for same atmospheric mass
        
        3. Tectonic Activity:
           - Higher g → more gravitational compression
           - Affects mantle convection and plate tectonics
        
        4. Biological Constraints:
           - Very high g limits maximum organism size
           - Affects evolution of land-based life
        
        Examples:
        ---------
        - Earth: g = 9.81 m/s²
        - Mars: g = 3.71 m/s² (38% of Earth, lost atmosphere)
        - Titan: g = 1.35 m/s² (but cold, retains atmosphere)
        - Jupiter: g = 24.79 m/s² (2.5× Earth)
        
        Parameters:
        -----------
        planet_mass : float
            Mass in Earth masses (M⊕)
        planet_radius : float
            Radius in Earth radii (R⊕)
        
        Returns:
        --------
        float
            Surface gravity in m/s²
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
        
        PHYSICS EXPLANATION:
        
        Escape velocity is the minimum speed needed to escape gravitational pull.
        
        Derivation from energy conservation:
        
        Total energy = Kinetic + Potential = 0 (at escape)
        (1/2)m v² - G M m / R = 0
        
        Solving for v:
        v_esc = √(2GM/R)
        
        Physical Interpretation:
        ------------------------
        
        For atmospheric retention, compare escape velocity to thermal velocity:
        
        v_thermal = √(3 k_B T / m_molecule)
        
        If v_thermal ≈ v_esc → significant atmospheric escape
        If v_thermal << v_esc → atmosphere retained
        
        Rule of thumb: Need v_esc > 6 × v_thermal for long-term retention
        
        Atmospheric Loss Scenarios:
        ----------------------------
        
        1. Thermal (Jeans) Escape:
           - High-energy tail of Maxwell-Boltzmann distribution
           - Hydrogen escapes easily (lightest, fastest)
        
        2. Hydrodynamic Escape:
           - When hydrogen escape is so rapid it drags heavier atoms
           - Important for early planetary evolution
        
        3. Impact Erosion:
           - Large impacts can blast away atmosphere
           - Proportional to (v_impact / v_esc)²
        
        Examples:
        ---------
        - Earth: 11.2 km/s (retains N₂, O₂; loses H₂, He)
        - Mars: 5.0 km/s (lost most atmosphere)
        - Titan: 2.6 km/s (cold, retains N₂)
        - Jupiter: 59.5 km/s (retains everything)
        
        Parameters:
        -----------
        planet_mass : float
            Mass in Earth masses (M⊕)
        planet_radius : float
            Radius in Earth radii (R⊕)
        
        Returns:
        --------
        float
            Escape velocity in km/s
        """
        
        M_kg = planet_mass * self.const.M_earth
        R_m = planet_radius * self.const.R_earth
        
        v_esc = np.sqrt(2 * self.const.G * M_kg / R_m)
        
        return v_esc / 1000  # Convert to km/s
    
    def calculate_jeans_parameter(
        self,
        planet_mass: float,
        planet_radius: float,
        temperature: float,
        molecular_mass: float = 2.0
    ) -> float:
        """
        Calculate Jeans escape parameter (λ) for atmospheric retention assessment.
        
        PHYSICS EXPLANATION:
        
        The Jeans parameter quantifies atmospheric retention by comparing
        gravitational binding energy to thermal energy:
        
        λ = (G M m) / (R k_B T)
        
        Where:
        - G: Gravitational constant
        - M: Planet mass
        - m: Molecular mass
        - R: Planet radius
        - k_B: Boltzmann constant
        - T: Exospheric temperature
        
        Physical Meaning:
        -----------------
        
        λ = E_gravitational / E_thermal
        
        - λ >> 1: Gravity dominates → molecules bound → good retention
        - λ ≈ 1: Energies comparable → significant escape
        - λ << 1: Thermal energy dominates → rapid escape
        
        Jeans Escape Rate:
        ------------------
        
        Φ ∝ exp(-λ) × (λ + 1)
        
        Interpretation Guidelines:
        --------------------------
        - λ > 15: Excellent retention over Gyr timescales
        - λ = 10-15: Good retention (like Earth with O₂, λ ≈ 14)
        - λ = 6-10: Moderate retention (Earth with H₂O, λ ≈ 20)
        - λ = 3-6: Poor retention (Mars with O₂, λ ≈ 6)
        - λ < 3: Rapid escape (gone in millions of years)
        
        Example Calculations:
        ---------------------
        
        Earth (T = 1000 K exosphere):
        - H₂ (m=2): λ ≈ 4 → escapes (indeed, Earth loses H₂)
        - H₂O (m=18): λ ≈ 20 → retained (but UV breaks down H₂O)
        - N₂ (m=28): λ ≈ 30 → excellent retention
        - O₂ (m=32): λ ≈ 34 → excellent retention
        
        Mars (T = 200 K, lower gravity):
        - O₂ (m=32): λ ≈ 6 → marginal (Mars lost most atmosphere)
        
        Parameters:
        -----------
        planet_mass : float
            Mass in Earth masses (M⊕)
        planet_radius : float
            Radius in Earth radii (R⊕)
        temperature : float
            Exospheric temperature in Kelvin
        molecular_mass : float, optional
            Molecular mass in atomic mass units (amu)
            Default: 2.0 (H₂)
            Common values: H₂O=18, N₂=28, O₂=32, CO₂=44
        
        Returns:
        --------
        float
            Jeans parameter (dimensionless)
        """
        
        M_kg = planet_mass * self.const.M_earth
        R_m = planet_radius * self.const.R_earth
        m_kg = molecular_mass * self.const.amu
        
        lambda_jeans = (self.const.G * M_kg * m_kg) / (R_m * self.const.k_B * temperature)
        
        return lambda_jeans
    
    def calculate_scale_height(
        self,
        temperature: float,
        planet_mass: float,
        planet_radius: float,
        mean_molecular_weight: float = 28.97
    ) -> float:
        """
        Calculate atmospheric scale height.
        
        PHYSICS EXPLANATION:
        
        Scale height (H) is the vertical distance over which atmospheric
        pressure decreases by a factor of e (≈2.718).
        
        Derivation from Hydrostatic Equilibrium:
        -----------------------------------------
        
        Pressure gradient balances gravity:
        dP/dz = -ρ g
        
        Using ideal gas law: P = ρ k_B T / m
        
        Results in exponential atmosphere:
        P(z) = P₀ exp(-z/H)
        
        Where scale height is:
        H = k_B T / (m g)
        
        Physical Meaning:
        -----------------
        
        H represents the "thickness" of the atmosphere:
        - Larger H → more extended atmosphere
        - Smaller H → more compressed atmosphere
        
        Scale Height Depends On:
        ------------------------
        
        1. Temperature (H ∝ T):
           - Hotter atmospheres are more extended
           - Hot Jupiters have huge scale heights
        
        2. Molecular Weight (H ∝ 1/m):
           - Light molecules (H₂) → large H
           - Heavy molecules (CO₂) → small H
        
        3. Gravity (H ∝ 1/g):
           - Low gravity → extended atmosphere
           - High gravity → compressed atmosphere
        
        Observational Significance:
        ---------------------------
        
        Transit spectroscopy signal:
        ΔF/F ∝ H/R
        
        Larger scale heights are easier to characterize:
        - Hot Jupiters: H ≈ 500-1000 km → easy to study
        - Earth: H ≈ 8.5 km → challenging
        - Super-Earths: H ≈ 100-200 km → HWO targets!
        
        Examples:
        ---------
        - Earth (N₂, T=250K): H ≈ 8.5 km
        - Mars (CO₂, T=210K): H ≈ 11 km
        - Venus (CO₂, T=735K): H ≈ 16 km
        - Titan (N₂, T=94K, low g): H ≈ 40 km
        - Hot Jupiter (H₂, T=1500K): H ≈ 700 km
        
        Parameters:
        -----------
        temperature : float
            Atmospheric temperature in Kelvin
        planet_mass : float
            Mass in Earth masses (M⊕)
        planet_radius : float
            Radius in Earth radii (R⊕)
        mean_molecular_weight : float, optional
            Mean molecular weight in amu
            Default: 28.97 (Earth's atmosphere, mostly N₂)
            Common: H₂=2, H₂O=18, N₂=28, CO₂=44
        
        Returns:
        --------
        float
            Scale height in kilometers
        """
        
        g = self.calculate_surface_gravity(planet_mass, planet_radius)
        m_kg = mean_molecular_weight * self.const.amu
        
        H = (self.const.k_B * temperature) / (m_kg * g)
        
        return H / 1000  # Convert to km
    
    def calculate_atmospheric_mass_from_pressure(
        self,
        surface_pressure: float,
        planet_radius: float
    ) -> float:
        """
        Estimate total atmospheric mass from surface pressure.
        
        PHYSICS EXPLANATION:
        
        Surface pressure is weight of atmosphere per unit area:
        
        P = (M_atm × g) / (4π R²)
        
        Solving for atmospheric mass:
        M_atm = (4π R² × P) / g
        
        This assumes:
        - Uniform gravity (valid for thin atmospheres)
        - Hydrostatic equilibrium
        
        Examples:
        ---------
        - Earth: P = 1 bar → M_atm ≈ 5.1×10¹⁸ kg
        - Venus: P = 92 bar → M_atm ≈ 4.8×10²⁰ kg (93× Earth)
        - Mars: P = 0.006 bar → M_atm ≈ 2.5×10¹⁶ kg (0.005× Earth)
        
        Parameters:
        -----------
        surface_pressure : float
            Surface pressure in bars (1 bar = 10⁵ Pa)
        planet_radius : float
            Radius in Earth radii (R⊕)
        
        Returns:
        --------
        float
            Atmospheric mass in Earth atmosphere masses
        """
        
        # Earth's atmospheric mass for normalization
        M_atm_earth = 5.15e18  # kg
        
        # Convert pressure to Pa
        P_pa = surface_pressure * 1e5
        
        # Planet surface area
        R_m = planet_radius * self.const.R_earth
        A = 4 * np.pi * R_m**2
        
        # Calculate gravity (assume Earth-like for simplicity)
        g = self.const.g_earth
        
        # Atmospheric mass
        M_atm = (A * P_pa) / g
        
        return M_atm / M_atm_earth
