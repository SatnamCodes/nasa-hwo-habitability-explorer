"""
Standard Exoplanet Planetary Habitability Index (SEPHI)

This module implements the SEPHI algorithm for calculating exoplanet habitability scores.
The index considers multiple parameters including:
1. Temperature Habitability (liquid water potential)
2. Size and Mass Habitability (potential for maintaining atmosphere)
3. Stellar Habitability (stable conditions for life)
4. Orbital Habitability (stable climate cycles)
"""

import numpy as np
from typing import Dict, Union, Optional

class SEPHICalculator:
    def __init__(self):
        # Constants for Earth-like conditions
        self.EARTH_RADIUS = 1.0  # Earth radii
        self.EARTH_MASS = 1.0    # Earth masses
        self.EARTH_TEMP = 288.0  # Kelvin
        self.SOL_TEMP = 5778.0   # Kelvin
        self.EARTH_ORBIT = 365.0 # days
        
        # Weights for different components
        self.weights = {
            'temperature': 0.35,
            'size': 0.25,
            'stellar': 0.20,
            'orbital': 0.20
        }
    
    def calculate_temperature_score(self, equilibrium_temp: float) -> float:
        """
        Calculate habitability score based on equilibrium temperature.
        Optimal range is 250-350K for liquid water potential.
        """
        optimal_range = (250, 350)
        broader_range = (150, 450)
        
        if optimal_range[0] <= equilibrium_temp <= optimal_range[1]:
            # Maximum score for optimal temperature range
            temp_score = 1.0 - abs(equilibrium_temp - self.EARTH_TEMP) / 100
        elif broader_range[0] <= equilibrium_temp <= broader_range[1]:
            # Reduced score for temperatures that might support exotic biochemistry
            temp_score = 0.5 - abs(equilibrium_temp - self.EARTH_TEMP) / 200
        else:
            # Minimal habitability outside reasonable ranges
            temp_score = 0.0
            
        return max(0.0, min(1.0, temp_score))
    
    def calculate_size_score(self, radius: float, mass: Optional[float] = None) -> float:
        """
        Calculate habitability score based on planet size and mass.
        Considers potential for maintaining atmosphere and reasonable surface gravity.
        """
        # Optimal ranges for rocky planets that can maintain atmospheres
        optimal_radius_range = (0.8, 1.4)  # Earth radii
        
        if optimal_radius_range[0] <= radius <= optimal_radius_range[1]:
            size_score = 1.0 - abs(radius - self.EARTH_RADIUS) / 0.6
        elif 0.5 <= radius <= 2.5:
            # Super-Earths and mini-Neptunes might be habitable
            size_score = 0.5 - abs(radius - self.EARTH_RADIUS) / 2.0
        else:
            size_score = 0.0
            
        # If mass is available, consider density implications
        if mass is not None:
            density_ratio = (mass / (radius ** 3))  # Relative to Earth
            if 0.7 <= density_ratio <= 1.5:
                size_score *= 1.0
            else:
                size_score *= 0.5
        
        return max(0.0, min(1.0, size_score))
    
    def calculate_stellar_score(self, stellar_temp: float, stellar_age: Optional[float] = None) -> float:
        """
        Calculate habitability score based on stellar parameters.
        Considers temperature and stability of the host star.
        """
        # Optimal ranges for different stellar types
        optimal_range = (4500, 6500)  # K to F stars
        broader_range = (2400, 7500)  # M to F stars
        
        if optimal_range[0] <= stellar_temp <= optimal_range[1]:
            stellar_score = 1.0 - abs(stellar_temp - self.SOL_TEMP) / 2000
        elif broader_range[0] <= stellar_temp <= broader_range[1]:
            stellar_score = 0.5 - abs(stellar_temp - self.SOL_TEMP) / 4000
        else:
            stellar_score = 0.0
            
        # Consider stellar age if available
        if stellar_age is not None:
            if 1.0 <= stellar_age <= 10.0:  # billions of years
                stellar_score *= 1.0
            elif 0.5 <= stellar_age <= 12.0:
                stellar_score *= 0.7
            else:
                stellar_score *= 0.3
                
        return max(0.0, min(1.0, stellar_score))
    
    def calculate_orbital_score(self, orbital_period: float) -> float:
        """
        Calculate habitability score based on orbital parameters.
        Considers implications for stable climate cycles.
        """
        # Optimal ranges for orbital stability
        optimal_range = (200, 500)  # days
        broader_range = (50, 700)   # days
        
        if optimal_range[0] <= orbital_period <= optimal_range[1]:
            orbital_score = 1.0 - abs(orbital_period - self.EARTH_ORBIT) / 300
        elif broader_range[0] <= orbital_period <= broader_range[1]:
            orbital_score = 0.5 - abs(orbital_period - self.EARTH_ORBIT) / 600
        else:
            orbital_score = 0.0
            
        return max(0.0, min(1.0, orbital_score))
    
    def calculate_sephi_score(
        self,
        equilibrium_temp: float,
        radius: float,
        stellar_temp: float,
        orbital_period: float,
        mass: Optional[float] = None,
        stellar_age: Optional[float] = None
    ) -> Dict[str, Union[float, Dict[str, float]]]:
        """
        Calculate the overall SEPHI score and component scores for an exoplanet.
        
        Parameters:
        - equilibrium_temp: Planet equilibrium temperature in Kelvin
        - radius: Planet radius in Earth radii
        - stellar_temp: Host star temperature in Kelvin
        - orbital_period: Orbital period in days
        - mass: Optional planet mass in Earth masses
        - stellar_age: Optional stellar age in billions of years
        
        Returns:
        Dictionary containing overall score and component scores
        """
        # Calculate component scores
        component_scores = {
            'temperature': self.calculate_temperature_score(equilibrium_temp),
            'size': self.calculate_size_score(radius, mass),
            'stellar': self.calculate_stellar_score(stellar_temp, stellar_age),
            'orbital': self.calculate_orbital_score(orbital_period)
        }
        
        # Calculate weighted overall score
        overall_score = sum(
            score * self.weights[component] 
            for component, score in component_scores.items()
        )
        
        return {
            'sephi_score': overall_score,
            'component_scores': component_scores
        }
