"""
BhoomiDrishti-NER: Geotechnical Physics Core
Implements Antecedent Precipitation Index (API_11) and 1D Infinite Slope
Factor of Safety (FS) formulation calibrated for Northeast India weathered regolith.
"""
import numpy as np
from typing import Union, Sequence

# Geotechnical constants calibrated for Guwahati-Shillong corridor (Meghalaya Plateau)
C_PRIME_KPA = 12.0          # Effective soil cohesion (kPa)
PHI_PRIME_DEG = 28.0        # Effective internal friction angle (degrees)
GAMMA_KN_M3 = 19.0          # Total unit weight of saturated regolith (kN/m^3)
SOIL_DEPTH_M = 2.0          # Average slip surface depth (m)
DECAY_FACTOR = 0.84         # 24-hour antecedent rainfall decay rate (Caine / GSI NER calibration)

def compute_api_11(current_rainfall: float, past_11_days: Sequence[float]) -> float:
    """
    Computes Antecedent Precipitation Index over 11-day window:
    API_t = P_t + sum_{i=1}^{11} (0.84)^i * P_{t-i}
    """
    api = float(current_rainfall)
    for i, p_prev in enumerate(past_11_days[:11], start=1):
        weight = DECAY_FACTOR ** i
        api += weight * float(p_prev)
    return round(api, 2)

def compute_pore_water_pressure(api_11: Union[float, np.ndarray], twi: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
    """
    Derives transient positive pore water pressure u (kPa) from API_11 saturation and Topographic Wetness Index.
    u = max(0, (api_11 / 80.0) * 8.5 + (twi / 10.0) * 4.0 - 2.0)
    """
    u = (api_11 / 80.0) * 8.5 + (twi / 10.0) * 4.0 - 2.0
    if isinstance(u, np.ndarray):
        return np.clip(u, 0.0, 26.0)
    return max(0.0, min(float(u), 26.0))

def compute_factor_of_safety(
    slope_deg: Union[float, np.ndarray],
    api_11: Union[float, np.ndarray],
    twi: Union[float, np.ndarray] = 6.5,
    c_prime: float = C_PRIME_KPA,
    phi_deg: float = PHI_PRIME_DEG,
    gamma: float = GAMMA_KN_M3,
    z: float = SOIL_DEPTH_M
) -> Union[float, np.ndarray]:
    """
    Calculates 1D Deterministic Infinite Slope Factor of Safety (FS):
    
    FS = [ c' + (gamma * z * cos^2(beta) - u) * tan(phi') ] / [ gamma * z * sin(beta) * cos(beta) ]
    
    beta: slope angle in degrees
    u: pore water pressure (kPa) from API_11 and TWI
    """
    beta_rad = np.radians(np.clip(slope_deg, 2.0, 85.0))
    phi_rad = np.radians(phi_deg)
    
    u = compute_pore_water_pressure(api_11, twi)
    
    cos_b = np.cos(beta_rad)
    sin_b = np.sin(beta_rad)
    
    # Normal stress on potential failure plane
    sigma_n = gamma * z * (cos_b ** 2)
    # Effective normal stress (sigma' = sigma - u)
    if isinstance(sigma_n, np.ndarray):
        sigma_effective = np.maximum(sigma_n - u, 0.1)
    else:
        sigma_effective = max(sigma_n - u, 0.1)
        
    shear_strength = c_prime + sigma_effective * np.tan(phi_rad)
    shear_stress = gamma * z * sin_b * cos_b
    
    if isinstance(shear_stress, np.ndarray):
        fs = shear_strength / np.maximum(shear_stress, 0.05)
        return np.clip(fs, 0.2, 5.0)
    else:
        fs = shear_strength / max(shear_stress, 0.05)
        return float(np.clip(fs, 0.2, 5.0))

def classify_fs_risk(fs: float) -> dict:
    """
    Maps analytical Factor of Safety to standard geotechnical risk category.
    """
    if fs < 1.0:
        return {"level": 3, "name": "Critical Hazard", "color": "#EF4444", "action": "Immediate Corridor Evacuation"}
    elif fs < 1.15:
        return {"level": 2, "name": "High Warning", "color": "#F97316", "action": "Traffic Diversion & BRO Standby"}
    elif fs < 1.30:
        return {"level": 1, "name": "Advisory / Watch", "color": "#EAB308", "action": "Active Geotechnical Monitoring"}
    else:
        return {"level": 0, "name": "Normal / Stable", "color": "#10B981", "action": "Routine Traffic Flow"}
