"""
Physical Constants for Habitability Calculations

This module defines all physical constants needed for exoplanet habitability
feature engineering based on established astrophysical values.
"""

from dataclasses import dataclass


@dataclass
class PhysicalConstants:
    """
    Universal physical constants for habitability calculations.
    All values in SI units unless otherwise specified.
    """
    
    # ========================================================================
    # FUNDAMENTAL CONSTANTS
    # ========================================================================
    
    # Gravitational constant (m³ kg⁻¹ s⁻²)
    G = 6.67430e-11
    
    # Boltzmann constant (J/K)
    k_B = 1.380649e-23
    
    # Stefan-Boltzmann constant (W m⁻² K⁻⁴)
    sigma_SB = 5.670374419e-8
    
    # Mass of hydrogen atom (kg)
    M_H = 1.6738e-27
    
    # Atomic mass unit (kg)
    amu = 1.66054e-27
    
    # ========================================================================
    # ASTRONOMICAL UNITS
    # ========================================================================
    
    # Astronomical Unit (m)
    AU = 1.495978707e11
    
    # Parsec (m)
    parsec = 3.0857e16
    
    # Year (seconds)
    year = 365.25 * 86400
    
    # ========================================================================
    # SOLAR REFERENCE VALUES
    # ========================================================================
    
    # Solar luminosity (W)
    L_sun = 3.828e26
    
    # Solar mass (kg)
    M_sun = 1.989e30
    
    # Solar radius (m)
    R_sun = 6.96e8
    
    # Solar effective temperature (K)
    T_sun = 5778
    
    # ========================================================================
    # EARTH REFERENCE VALUES
    # ========================================================================
    
    # Earth mass (kg)
    M_earth = 5.972e24
    
    # Earth radius (m)
    R_earth = 6.371e6
    
    # Earth surface gravity (m/s²)
    g_earth = 9.81
    
    # Earth escape velocity (m/s)
    v_esc_earth = 11200
    
    # Earth mean temperature (K)
    T_earth = 288
    
    # Earth bulk density (g/cm³)
    rho_earth = 5.51
    
    # Earth orbital period (days)
    P_earth = 365.25
    
    # Earth semi-major axis (AU)
    a_earth = 1.0
    
    # ========================================================================
    # JUPITER REFERENCE VALUES
    # ========================================================================
    
    # Jupiter mass (kg)
    M_jupiter = 1.898e27
    
    # Jupiter radius (m)
    R_jupiter = 6.9911e7
    
    # Jupiter bulk density (g/cm³)
    rho_jupiter = 1.33
    
    # ========================================================================
    # CONVERSION FACTORS
    # ========================================================================
    
    @staticmethod
    def earth_masses_to_kg(m_earth: float) -> float:
        """Convert Earth masses to kilograms"""
        return m_earth * PhysicalConstants.M_earth
    
    @staticmethod
    def earth_radii_to_m(r_earth: float) -> float:
        """Convert Earth radii to meters"""
        return r_earth * PhysicalConstants.R_earth
    
    @staticmethod
    def jupiter_masses_to_kg(m_jup: float) -> float:
        """Convert Jupiter masses to kilograms"""
        return m_jup * PhysicalConstants.M_jupiter
    
    @staticmethod
    def jupiter_radii_to_m(r_jup: float) -> float:
        """Convert Jupiter radii to meters"""
        return r_jup * PhysicalConstants.R_jupiter
    
    @staticmethod
    def solar_masses_to_kg(m_sun: float) -> float:
        """Convert Solar masses to kilograms"""
        return m_sun * PhysicalConstants.M_sun
    
    @staticmethod
    def solar_radii_to_m(r_sun: float) -> float:
        """Convert Solar radii to meters"""
        return r_sun * PhysicalConstants.R_sun
    
    @staticmethod
    def au_to_m(au: float) -> float:
        """Convert AU to meters"""
        return au * PhysicalConstants.AU
    
    @staticmethod
    def days_to_seconds(days: float) -> float:
        """Convert days to seconds"""
        return days * 86400
