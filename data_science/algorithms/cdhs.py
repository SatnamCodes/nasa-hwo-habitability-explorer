"""
Comprehensive Distance Habitability Score (CDHS) Algorithm

This module implements the CDHS algorithm for assessing exoplanet habitability
based on multiple physical and orbital parameters.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

@dataclass
class HabitabilityCriteria:
    """Habitability criteria thresholds and weights"""
    # Temperature ranges (K)
    temp_min: float = 273.0  # 0°C
    temp_max: float = 373.0  # 100°C
    temp_optimal: float = 288.0  # 15°C
    
    # Radius ranges (Earth radii)
    radius_min: float = 0.5
    radius_max: float = 1.5
    radius_optimal: float = 1.0
    
    # Stellar flux ranges (Earth = 1.0)
    flux_min: float = 0.5
    flux_max: float = 2.0
    flux_optimal: float = 1.0
    
    # Weights for different factors
    temp_weight: float = 0.35
    radius_weight: float = 0.25
    flux_weight: float = 0.20
    stability_weight: float = 0.20

class CDHSAlgorithm:
    """
    Comprehensive Distance Habitability Score algorithm implementation
    
    Calculates habitability scores based on multiple physical parameters
    using distance-based scoring and weighted combinations.
    """
    
    def __init__(self, criteria: Optional[HabitabilityCriteria] = None):
        self.criteria = criteria or HabitabilityCriteria()
    
    def calculate_temperature_score(self, temp: float) -> float:
        """Calculate habitability score based on temperature"""
        if temp < self.criteria.temp_min or temp > self.criteria.temp_max:
            return 0.0
        
        # Distance from optimal temperature
        distance = abs(temp - self.criteria.temp_optimal)
        max_distance = max(
            self.criteria.temp_optimal - self.criteria.temp_min,
            self.criteria.temp_max - self.criteria.temp_optimal
        )
        
        # Score decreases linearly with distance from optimal
        score = 1.0 - (distance / max_distance)
        return max(0.0, score)
    
    def calculate_radius_score(self, radius: float) -> float:
        """Calculate habitability score based on planet radius"""
        if radius < self.criteria.radius_min or radius > self.criteria.radius_max:
            return 0.0
        
        # Distance from optimal radius
        distance = abs(radius - self.criteria.radius_optimal)
        max_distance = max(
            self.criteria.radius_optimal - self.criteria.radius_min,
            self.criteria.radius_max - self.criteria.radius_optimal
        )
        
        score = 1.0 - (distance / max_distance)
        return max(0.0, score)
    
    def calculate_flux_score(self, flux: float) -> float:
        """Calculate habitability score based on stellar flux"""
        if flux < self.criteria.flux_min or flux > self.criteria.flux_max:
            return 0.0
        
        # Distance from optimal flux
        distance = abs(flux - self.criteria.flux_optimal)
        max_distance = max(
            self.criteria.flux_optimal - self.criteria.flux_min,
            self.criteria.flux_max - self.criteria.flux_optimal
        )
        
        score = 1.0 - (distance / max_distance)
        return max(0.0, score)
    
    def calculate_stability_score(self, eccentricity: float, 
                                orbital_period: float) -> float:
        """Calculate habitability score based on orbital stability"""
        # Lower eccentricity is better (more circular orbit)
        ecc_score = max(0.0, 1.0 - eccentricity)
        
        # Moderate orbital period is better (not too fast, not too slow)
        # Earth-like period around 365 days
        period_score = 1.0
        if orbital_period > 0:
            # Prefer periods between 100-1000 days
            if 100 <= orbital_period <= 1000:
                period_score = 1.0
            else:
                # Penalize extreme periods
                period_score = max(0.0, 1.0 - abs(orbital_period - 365) / 1000)
        
        # Combine eccentricity and period scores
        return (ecc_score * 0.6) + (period_score * 0.4)
    
    def calculate_cdhs(self, 
                       temperature: float,
                       radius: float,
                       stellar_flux: float,
                       eccentricity: float = 0.0,
                       orbital_period: float = 365.0) -> float:
        """
        Calculate the Comprehensive Distance Habitability Score
        
        Args:
            temperature: Planet equilibrium temperature (K)
            radius: Planet radius (Earth radii)
            stellar_flux: Stellar flux at planet (Earth = 1.0)
            eccentricity: Orbital eccentricity (0-1)
            orbital_period: Orbital period (days)
        
        Returns:
            CDHS score between 0.0 and 1.0
        """
        # Calculate individual component scores
        temp_score = self.calculate_temperature_score(temperature)
        radius_score = self.calculate_radius_score(radius)
        flux_score = self.calculate_flux_score(stellar_flux)
        stability_score = self.calculate_stability_score(eccentricity, orbital_period)
        
        # Calculate weighted CDHS score
        cdhs = (
            temp_score * self.criteria.temp_weight +
            radius_score * self.criteria.radius_weight +
            flux_score * self.criteria.flux_weight +
            stability_score * self.criteria.stability_weight
        )
        
        return min(1.0, max(0.0, cdhs))
    
    def calculate_batch_cdhs(self, data: pd.DataFrame) -> pd.Series:
        """
        Calculate CDHS scores for a batch of planets
        
        Args:
            data: DataFrame with columns: temperature, radius, stellar_flux, 
                  eccentricity, orbital_period
        
        Returns:
            Series of CDHS scores
        """
        scores = []
        
        for _, row in data.iterrows():
            score = self.calculate_cdhs(
                temperature=row.get('temperature', 0),
                radius=row.get('radius', 0),
                stellar_flux=row.get('stellar_flux', 0),
                eccentricity=row.get('eccentricity', 0),
                orbital_period=row.get('orbital_period', 365)
            )
            scores.append(score)
        
        return pd.Series(scores, index=data.index)
    
    def get_score_breakdown(self, 
                           temperature: float,
                           radius: float,
                           stellar_flux: float,
                           eccentricity: float = 0.0,
                           orbital_period: float = 365.0) -> Dict[str, float]:
        """Get detailed breakdown of all component scores"""
        return {
            'temperature_score': self.calculate_temperature_score(temperature),
            'radius_score': self.calculate_radius_score(radius),
            'flux_score': self.calculate_flux_score(stellar_flux),
            'stability_score': self.calculate_stability_score(eccentricity, orbital_period),
            'cdhs_total': self.calculate_cdhs(
                temperature, radius, stellar_flux, eccentricity, orbital_period
            )
        }

def create_cdhs_algorithm(criteria: Optional[HabitabilityCriteria] = None) -> CDHSAlgorithm:
    """Factory function to create CDHS algorithm instance"""
    return CDHSAlgorithm(criteria)
