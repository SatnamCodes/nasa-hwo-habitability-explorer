"""
Orbital Dynamics and Tidal Physics

This module implements orbital mechanics and tidal heating calculations
relevant to planetary habitability.

References:
- Murray & Dermott (1999) - Solar System Dynamics
- Barnes et al. (2013) - Tidal Locking and Habitability
- Peale et al. (1979) - Tidal Heating of Io
"""

import numpy as np
from typing import Optional
from .physics_constants import PhysicalConstants


class OrbitalPhysics:
    """
    Orbital dynamics and tidal calculations for habitability assessment.
    """
    
    def __init__(self):
        self.const = PhysicalConstants()
    
    def calculate_orbital_velocity(
        self,
        stellar_mass: float,
        semi_major_axis: float
    ) -> float:
        """
        Calculate orbital velocity for circular orbit.
        
        PHYSICS EXPLANATION:
        
        From Kepler's laws and Newton's gravity, orbital velocity is:
        
        v = √(GM/a)
        
        Derived from centripetal force = gravitational force:
        m v²/a = G M_star m / a²
        
        Where:
        - G: Gravitational constant
        - M: Stellar mass
        - a: Semi-major axis (orbital radius for circular orbit)
        
        Physical Significance:
        ----------------------
        - Determines orbital period: P = 2πa/v
        - Affects impact velocity (habitability threat)
        - Influences atmospheric escape (ram pressure stripping)
        
        Examples:
        ---------
        - Earth: v = 29.8 km/s
        - Mercury: v = 47.4 km/s (closer to Sun)
        - Mars: v = 24.1 km/s (farther from Sun)
        
        Parameters:
        -----------
        stellar_mass : float
            Mass in solar masses (M☉)
        semi_major_axis : float
            Orbital distance in AU
        
        Returns:
        --------
        float
            Orbital velocity in km/s
        """
        
        M_kg = stellar_mass * self.const.M_sun
        a_m = semi_major_axis * self.const.AU
        
        v = np.sqrt(self.const.G * M_kg / a_m)
        
        return v / 1000  # Convert to km/s
    
    def calculate_hill_sphere(
        self,
        planet_mass: float,
        stellar_mass: float,
        semi_major_axis: float
    ) -> float:
        """
        Calculate Hill sphere radius (gravitational sphere of influence).
        
        PHYSICS EXPLANATION:
        
        The Hill sphere defines the region where a planet's gravity dominates
        over the star's tidal forces. It's derived from the restricted
        three-body problem.
        
        Formula:
        r_H = a × (M_planet / 3M_star)^(1/3)
        
        Where:
        - a: Semi-major axis
        - M_planet: Planet mass
        - M_star: Stellar mass
        
        Derivation (Simplified):
        ------------------------
        At Hill sphere boundary, planet's gravity ≈ star's tidal force:
        
        G M_planet / r_H² ≈ G M_star / a² × (r_H / a)
        
        Solving gives: r_H ≈ a (M_planet / 3M_star)^(1/3)
        
        Physical Applications:
        ----------------------
        
        1. Satellite Stability:
           - Moons must orbit within r_H to be stable
           - Practical limit: r_sat < r_H / 3 for long-term stability
        
        2. Ring Systems:
           - Rings form inside Roche limit but within Hill sphere
        
        3. Atmospheric Extent:
           - Planet's exosphere can extend to ~r_H
           - Important for atmospheric characterization
        
        4. Trojan Asteroids:
           - Stable at L4/L5 points if Hill sphere large enough
        
        Examples:
        ---------
        - Earth: r_H ≈ 1.5 million km (0.01 AU)
           → Moon at 384,000 km (stable)
        
        - Jupiter: r_H ≈ 51 million km (0.34 AU)
           → Many moons, extensive system
        
        - Mars: r_H ≈ 1.0 million km
           → Phobos/Deimos are close, eventually will fall
        
        Parameters:
        -----------
        planet_mass : float
            Mass in Earth masses (M⊕)
        stellar_mass : float
            Mass in solar masses (M☉)
        semi_major_axis : float
            Orbital distance in AU
        
        Returns:
        --------
        float
            Hill sphere radius in AU
        """
        
        M_p = planet_mass * self.const.M_earth
        M_s = stellar_mass * self.const.M_sun
        a = semi_major_axis * self.const.AU
        
        r_H = a * (M_p / (3 * M_s)) ** (1/3)
        
        return r_H / self.const.AU
    
    def calculate_tidal_heating_rate(
        self,
        planet_mass: float,
        planet_radius: float,
        stellar_mass: float,
        semi_major_axis: float,
        eccentricity: float,
        orbital_period: float,
        tidal_Q: float = 100.0,
        love_number: float = 0.3
    ) -> float:
        """
        Calculate tidal heating rate (crucial for M-dwarf habitable zones).
        
        PHYSICS EXPLANATION:
        
        Tidal heating occurs when gravitational forces vary across a planet,
        causing periodic deformation and internal friction.
        
        Formula (Peale et al. 1979):
        
        dE/dt = -(21/2) × (k₂/Q) × (G³ M_star² M_planet R_planet⁵ e² n⁵) / a⁶
        
        Where:
        - k₂: Love number (tidal deformability ~0.3 for rocky planets)
        - Q: Tidal quality factor (inverse of energy dissipation ~100 for rocky)
        - n: Mean motion = 2π/P
        - e: Orbital eccentricity
        - a: Semi-major axis
        
        Physical Mechanism:
        -------------------
        
        1. Elliptical Orbit → Varying Tidal Force:
           - Periapse: Strong tides (close to star)
           - Apoapse: Weak tides (far from star)
        
        2. Tidal Bulge Lags Behind:
           - Planet rotates, tidal bulge doesn't instantly align
           - Misalignment causes internal friction → heat
        
        3. Circular Orbit (e=0):
           - No tidal heating if tidally locked
           - Uniform tides, no deformation cycle
        
        Heating Rate Scales:
        --------------------
        - ∝ e²: Eccentricity is critical (e=0 → no heating)
        - ∝ 1/a⁶: Very strong distance dependence
        - ∝ M_star²: More massive stars → stronger tides
        
        Habitability Implications:
        ---------------------------
        
        Positive:
        + Maintains subsurface oceans (Europa, Enceladus)
        + Drives geological activity
        + Sustains magnetic dynamo
        
        Negative:
        - Excessive heating → runaway greenhouse (Io)
        - Tidal locking → permanent day/night
        - Orbital circularization → removes heat source
        
        M-Dwarf Planets:
        ----------------
        HZ planets around M-dwarfs are very close (a ~ 0.05 AU)
        - High tidal heating even for small e
        - Likely tidally locked
        - Important for atmospheric dynamics
        
        Examples:
        ---------
        - Io: ~10¹⁴ W total (100× Earth's internal heat)
        - Europa: ~10¹³ W (maintains subsurface ocean)
        - Earth: ~4×10¹³ W (mostly radioactive decay)
        
        Parameters:
        -----------
        planet_mass : float
            Mass in Earth masses (M⊕)
        planet_radius : float
            Radius in Earth radii (R⊕)
        stellar_mass : float
            Mass in solar masses (M☉)
        semi_major_axis : float
            Orbital distance in AU
        eccentricity : float
            Orbital eccentricity (0-1)
        orbital_period : float
            Orbital period in days
        tidal_Q : float, optional
            Tidal quality factor (default: 100 for rocky planets)
            Lower Q → more dissipation → more heating
        love_number : float, optional
            Tidal Love number k₂ (default: 0.3 for rocky planets)
            Higher k₂ → more deformable → more heating
        
        Returns:
        --------
        float
            Tidal heating rate in Watts per kilogram (W/kg)
            Earth's internal heating: ~2.5×10⁻¹¹ W/kg
        """
        
        # Handle circular orbits (no tidal heating)
        if eccentricity < 0.001:
            return 0.0
        
        # Convert to SI units
        M_p = planet_mass * self.const.M_earth
        R_p = planet_radius * self.const.R_earth
        M_s = stellar_mass * self.const.M_sun
        a = semi_major_axis * self.const.AU
        P_seconds = orbital_period * 86400
        
        # Mean motion (orbital frequency)
        n = 2 * np.pi / P_seconds
        
        # Tidal heating formula (total power)
        numerator = 21 * (love_number / tidal_Q) * self.const.G**3 * M_s**2 * M_p * R_p**5 * eccentricity**2 * n**5
        denominator = 2 * a**6
        
        E_dot_total = numerator / denominator
        
        # Specific heating rate (per unit mass)
        heating_rate = E_dot_total / M_p
        
        return heating_rate
    
    def calculate_tidal_locking_timescale(
        self,
        planet_mass: float,
        planet_radius: float,
        stellar_mass: float,
        semi_major_axis: float,
        initial_rotation_period: float = 24.0,
        tidal_Q: float = 100.0
    ) -> float:
        """
        Estimate time for planet to become tidally locked.
        
        PHYSICS EXPLANATION:
        
        Tidal locking occurs when a planet's rotation period equals its
        orbital period, so the same face always points toward the star.
        
        Locking Timescale (Peale, 1977):
        
        τ_lock = (2/3) × (Q/k₂) × (a⁶/G M_star²) × (ω_initial/R²)
        
        Where:
        - Q: Tidal dissipation factor (~100 for rocky planets)
        - k₂: Love number (~0.3)
        - ω_initial: Initial rotation rate
        - R: Planet radius
        - a: Semi-major axis
        
        Key Dependencies:
        -----------------
        - ∝ a⁶: Distance is crucial (closer → faster locking)
        - ∝ 1/M_star²: More massive stars lock planets faster
        - ∝ Q: Higher Q → slower dissipation → slower locking
        
        Habitability Implications:
        ---------------------------
        
        Tidally Locked Planets:
        + Permanent day/night sides
        + Extreme temperature gradients
        + Atmospheric circulation patterns crucial
        + Possible "eyeball Earth" scenario
        
        Day Side:
        - Constant stellar heating
        - Potential water loss (runaway greenhouse)
        
        Night Side:
        - Permanent cold
        - Atmospheric freeze-out possible
        
        Terminator (twilight zone):
        - Potentially habitable region
        - Moderate temperatures
        
        M-Dwarf HZ Planets:
        -------------------
        - Typically lock in < 1 billion years
        - All known M-dwarf HZ planets likely locked
        - Key challenge for habitability assessment
        
        Examples:
        ---------
        - Moon: Already locked to Earth (τ << solar system age)
        - Mercury: 3:2 spin-orbit resonance (not fully locked)
        - TRAPPIST-1 planets: All tidally locked
        - Proxima Cen b: Likely locked
        
        Parameters:
        -----------
        planet_mass : float
            Mass in Earth masses (M⊕)
        planet_radius : float
            Radius in Earth radii (R⊕)
        stellar_mass : float
            Mass in solar masses (M☉)
        semi_major_axis : float
            Orbital distance in AU
        initial_rotation_period : float, optional
            Initial rotation period in hours (default: 24 hours)
        tidal_Q : float, optional
            Tidal quality factor (default: 100)
        
        Returns:
        --------
        float
            Tidal locking timescale in millions of years (Myr)
        """
        
        # Convert to SI
        R = planet_radius * self.const.R_earth
        M_s = stellar_mass * self.const.M_sun
        a = semi_major_axis * self.const.AU
        omega_initial = 2 * np.pi / (initial_rotation_period * 3600)
        
        # Love number for rocky planets
        k2 = 0.3
        
        # Locking timescale (simplified formula)
        numerator = (2/3) * (tidal_Q / k2) * (a**6 / (self.const.G * M_s**2)) * omega_initial
        denominator = R**2
        
        tau_lock_seconds = numerator / denominator
        
        # Convert to millions of years
        tau_lock_myr = tau_lock_seconds / (self.const.year * 1e6)
        
        return tau_lock_myr
    
    def calculate_roche_limit(
        self,
        planet_density: float,
        stellar_radius: float
    ) -> float:
        """
        Calculate Roche limit (minimum stable distance).
        
        PHYSICS EXPLANATION:
        
        The Roche limit is the distance below which tidal forces exceed
        the object's self-gravity, causing it to break apart.
        
        For rigid body:
        d_Roche = 2.46 × R_star × (ρ_star / ρ_planet)^(1/3)
        
        For fluid body:
        d_Roche = 2.88 × R_star × (ρ_star / ρ_planet)^(1/3)
        
        Physical Mechanism:
        -------------------
        - Tidal force: Δg = 2 G M_star R_planet / d³
        - Self-gravity: g_self = G M_planet / R_planet²
        - If Δg > g_self → disruption
        
        Applications:
        -------------
        - Planetary rings form inside Roche limit
        - Satellites must orbit outside to avoid destruction
        - Hot Jupiters can evaporate if too close
        
        Parameters:
        -----------
        planet_density : float
            Bulk density in g/cm³
        stellar_radius : float
            Stellar radius in solar radii (R☉)
        
        Returns:
        --------
        float
            Roche limit in AU
        """
        
        # Assume stellar density ~ 1.4 g/cm³ (Sun-like)
        stellar_density = 1.4
        
        R_star_m = stellar_radius * self.const.R_sun
        
        # Rigid body formula
        d_roche = 2.46 * R_star_m * (stellar_density / planet_density) ** (1/3)
        
        return d_roche / self.const.AU
