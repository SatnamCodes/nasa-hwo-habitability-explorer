from typing import Dict, List, Optional
import math

# Physical constants (simplified)
AU_METERS = 1.496e11
PARSEC_METERS = 3.086e16
RAD_TO_MAS = 206265000.0  # radians to milliarcseconds

WAVELENGTHS_MICRON = {
    "UV": 0.25,
    "Visible": 0.55,
    "NIR": 1.6,
}

class ObservabilityParams:
    def __init__(
        self,
        telescope_diameter_m: float = 6.0,
        wavelength_band: str = "Visible",
        inner_working_angle_mas: float = 75.0,
        contrast_sensitivity: float = 1e-10,
    ) -> None:
        self.telescope_diameter_m = telescope_diameter_m
        self.wavelength_band = wavelength_band
        self.inner_working_angle_mas = inner_working_angle_mas
        self.contrast_sensitivity = contrast_sensitivity


def angular_separation_mas(semi_major_axis_au: float, distance_pc: float) -> float:
    if distance_pc <= 0 or semi_major_axis_au <= 0:
        return 0.0
    # theta = a / d (radians), convert to mas
    theta_rad = (semi_major_axis_au * AU_METERS) / (distance_pc * PARSEC_METERS)
    return theta_rad * RAD_TO_MAS


def planet_star_contrast_ratio(planet_radius_re: float, albedo: float = 0.3) -> float:
    # Very simplified reflected light contrast ~ A * (Rp/Rs)^2; approximate Rs ~ 1 R_sun ~ 109 R_earth
    if planet_radius_re <= 0:
        return 0.0
    rs_re = 109.0
    return max(1e-12, albedo * (planet_radius_re / rs_re) ** 2)


def required_telescope_diameter_m(
    separation_mas: float, wavelength_band: str, iwa_factor: float = 2.0
) -> float:
    # Diffraction limit theta ~ 1.22 * lambda / D; D ~ 1.22 * lambda / theta
    if separation_mas <= 0:
        return float("inf")
    wavelength_um = WAVELENGTHS_MICRON.get(wavelength_band, 0.55)
    theta_rad = separation_mas / RAD_TO_MAS
    d_m = 1.22 * (wavelength_um * 1e-6) / theta_rad
    return d_m * iwa_factor


def spectroscopic_feasibility(
    contrast: float, contrast_limit: float
) -> float:
    # Score 0..1 based on how far below sensitivity limit the contrast is
    if contrast_limit <= 0:
        return 0.0
    ratio = contrast_limit / max(contrast, 1e-20)
    # log-scale mapping; 1 when contrast is 10x better than limit, 0 when 10x worse
    score = (math.log10(ratio) + 1) / 2
    return max(0.0, min(1.0, score))


def iwa_check_score(separation_mas: float, inner_working_angle_mas: float) -> float:
    if inner_working_angle_mas <= 0:
        return 0.0
    if separation_mas <= 0:
        return 0.0
    # 0 at sep < IWA; approach 1 as sep >> IWA
    ratio = separation_mas / inner_working_angle_mas
    return max(0.0, min(1.0, (ratio - 0.5)))


def compute_observability(
    planet: Dict,
    params: ObservabilityParams,
) -> Dict[str, float]:
    a_au = float(planet.get("pl_orbsmax") or planet.get("pl_orbper", 365.0) ** (2/3))  # fallback
    dist_pc = float(planet.get("sy_dist", 10.0))
    radius_re = float(planet.get("pl_rade", 1.0))

    sep_mas = angular_separation_mas(a_au, dist_pc)
    contrast = planet_star_contrast_ratio(radius_re)
    req_d = required_telescope_diameter_m(sep_mas, params.wavelength_band)
    spec_score = spectroscopic_feasibility(contrast, params.contrast_sensitivity)
    iwa_score = iwa_check_score(sep_mas, params.inner_working_angle_mas)

    # Combined observability score (weighted)
    combined = 0.4 * iwa_score + 0.4 * spec_score + 0.2 * max(0.0, 1.0 - max(0.0, (req_d - params.telescope_diameter_m) / max(req_d, 1e-6)))

    return {
        "separation_mas": sep_mas,
        "contrast_ratio": contrast,
        "required_diameter_m": req_d,
        "spectroscopic_score": spec_score,
        "iwa_score": iwa_score,
        "observability_score": max(0.0, min(1.0, combined)),
    }


def score_batch(
    planets: List[Dict],
    params: ObservabilityParams,
) -> List[Dict[str, float]]:
    return [compute_observability(p, params) for p in planets]
