"""
BhoomiDrishti-NER: Border Roads Organisation (BRO) Logistics & Equipment Staging Engine
Tracks heavy machinery depots, pre-positioned excavators, mobilization ETAs,
and estimated road clearance time for high-risk highway chainages.
"""
import math
from typing import List, Dict, Any

DEPOTS = [
    {
        "id": "BRO-DEPOT-NONGPOH",
        "name": "Nongpoh Heavy Equipment Base (103 RCC / BRO)",
        "chainage_km": 41.2,
        "latitude": 25.8980,
        "longitude": 91.8810,
        "equipment": [
            {"type": "CAT 320D Hydraulic Excavator", "count": 2, "status": "READY"},
            {"type": "JCB 3DX Backhoe Loader", "count": 3, "status": "STANDBY"},
            {"type": "Tata 1618 Tipper Truck (10 Cu.m)", "count": 5, "status": "READY"},
            {"type": "Crawler Drill / Rock Bolter", "count": 1, "status": "READY"}
        ],
        "crew_readiness": "15 Minutes (Rapid Alert)",
        "contact_officer": "Maj. R. Sharma (OC 103 RCC)"
    },
    {
        "id": "BRO-DEPOT-UMSNING",
        "name": "Umsning Quick Response Depot (104 RCC / BRO)",
        "chainage_km": 62.5,
        "latitude": 25.7350,
        "longitude": 91.8980,
        "equipment": [
            {"type": "Komatsu PC210 Excavator", "count": 1, "status": "READY"},
            {"type": "JCB 432ZX Wheel Loader", "count": 2, "status": "READY"},
            {"type": "Tipper Dumper", "count": 4, "status": "STANDBY"}
        ],
        "crew_readiness": "10 Minutes (Pre-Positioned)",
        "contact_officer": "Capt. A. Sangma (2IC 104 RCC)"
    },
    {
        "id": "BRO-DEPOT-BARAPANI",
        "name": "Barapani Highway Outpost (BRO / Meghalaya PWD)",
        "chainage_km": 69.8,
        "latitude": 25.6650,
        "longitude": 91.9110,
        "equipment": [
            {"type": "Bulldozer D6R", "count": 1, "status": "READY"},
            {"type": "Heavy Recovery Crane (40 Ton)", "count": 1, "status": "STANDBY"}
        ],
        "crew_readiness": "20 Minutes",
        "contact_officer": "Er. P. Lyngdoh (PWD Executive)"
    }
]

def calculate_logistics_dispatch(target_km: float, estimated_debris_volume_m3: float = 450.0) -> Dict[str, Any]:
    """
    Computes nearest staging bay, estimated transit time, and road clearance duration.
    Assumes BRO convoy mountain speed of ~25 km/h and excavator clearance rate of 60 m^3/hr.
    """
    best_depot = None
    min_dist_km = 999.0
    
    for depot in DEPOTS:
        dist = abs(depot["chainage_km"] - target_km)
        if dist < min_dist_km:
            min_dist_km = dist
            best_depot = depot
            
    # Transit time in minutes (25 km/h on mountain road + 10 min mobilization)
    transit_mins = int((min_dist_km / 25.0) * 60.0 + 12.0)
    
    # Excavation and debris clearing time (assuming 2 excavators @ 60m3/hr each = 120m3/hr)
    clearance_hours = round(estimated_debris_volume_m3 / 120.0, 1)
    clearance_mins = int(clearance_hours * 60.0)
    
    total_eta_mins = transit_mins + clearance_mins
    
    return {
        "target_chainage_km": target_km,
        "nearest_depot": best_depot,
        "distance_to_site_km": round(min_dist_km, 2),
        "transit_eta_minutes": transit_mins,
        "estimated_debris_volume_m3": estimated_debris_volume_m3,
        "estimated_clearance_hours": clearance_hours,
        "total_restoration_eta_minutes": total_eta_mins,
        "recommended_action": f"Dispatch from {best_depot['name']}. ETA to chainage km {target_km:.1f} is {transit_mins} mins."
    }

def get_all_depots() -> List[Dict[str, Any]]:
    return DEPOTS

if __name__ == "__main__":
    dispatch = calculate_logistics_dispatch(53.2, estimated_debris_volume_m3=600.0)
    print("Logistics dispatch advisory:", dispatch["recommended_action"])
