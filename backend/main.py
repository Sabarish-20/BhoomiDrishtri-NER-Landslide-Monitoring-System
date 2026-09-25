"""
BhoomiDrishti-NER: FastAPI Backend API & Unified Frontend Server
SIH26001: AI-Based Early Warning and Landslide Risk Monitoring System in NER
Corridor: NH-106 (Guwahati to Shillong, Meghalaya, km 40 to km 70)
"""
import os
import pandas as pd
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.services.terrain_engine import terrain_corridor
from backend.services.weather_stream import weather_service
from backend.ml.physics import compute_factor_of_safety, compute_api_11, classify_fs_risk
from backend.ml.model import pgml_engine, FEATURE_NAMES, RISK_LABELS
from backend.services.cap_alert import cap_alert_service
from backend.services.crowdsource import crowdsource_service
from backend.services.logistics import get_all_depots, calculate_logistics_dispatch

app = FastAPI(
    title="BhoomiDrishti-NER API",
    description="Physics-Guided Machine Learning Early Warning System for NH-106 Landslide Risk",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup: train/load PGML model
@app.on_event("startup")
async def startup_event():
    print("[BhoomiDrishti-NER] Initializing PGML engine and caching corridor grid...")
    pgml_engine.load_model()
    # Initial weather sync
    await weather_service.fetch_live_weather()

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "BhoomiDrishti-NER",
        "corridor": "NH-106 (Guwahati-Shillong km 40 to 70)",
        "model_loaded": pgml_engine.model is not None,
        "grid_resolution": "30 meters",
        "total_cells": len(terrain_corridor.get_grid())
    }

@app.get("/api/weather/current")
async def get_current_weather():
    """Returns real-time or active simulated weather telemetry."""
    weather = await weather_service.get_effective_weather()
    return weather

class StormTriggerRequest(BaseModel):
    rainfall_mm_hr: float = Field(..., ge=0.0, le=250.0, description="Simulated rainfall intensity (mm/hr)")
    antecedent_days: int = Field(5, ge=1, le=15, description="Days of preceding monsoon wetness")
    event_name: str = Field("Simulated Cloudburst Surge", description="Label for simulation scenario")

@app.post("/api/simulation/trigger-storm")
async def trigger_storm_simulation(payload: StormTriggerRequest):
    """
    Overrides real-time weather with custom cloudburst / monsoon intensity
    and triggers instant corridor risk recalculation.
    """
    weather_service.set_storm_simulation(
        rainfall_mm_hr=payload.rainfall_mm_hr,
        antecedent_days=payload.antecedent_days,
        event_name=payload.event_name
    )
    weather = await weather_service.get_effective_weather()
    
    # Re-evaluate alerts
    grid_geojson = await get_corridor_grid()
    cells = [f["properties"] for f in grid_geojson["features"]]
    alert = cap_alert_service.evaluate_and_generate_alerts(cells, weather)
    
    return {
        "message": f"Storm simulation '{payload.event_name}' engaged at {payload.rainfall_mm_hr} mm/hr.",
        "weather_state": weather,
        "active_alert_triggered": alert is not None,
        "alert_summary": alert
    }

@app.post("/api/simulation/reset")
async def reset_simulation():
    """Resets simulation back to live Open-Meteo telemetry."""
    weather_service.reset_simulation()
    weather = await weather_service.get_effective_weather()
    
    grid_geojson = await get_corridor_grid()
    cells = [f["properties"] for f in grid_geojson["features"]]
    cap_alert_service.evaluate_and_generate_alerts(cells, weather)
    
    return {
        "message": "Simulation reset. Reverted to live Open-Meteo telemetry.",
        "weather_state": weather
    }

@app.get("/api/corridor/grid")
async def get_corridor_grid():
    """
    Returns full GeoJSON of NH-106 30-meter chainage cells with live/simulated
    Physics-Guided Machine Learning risk predictions, Factor of Safety (FS), and API_11.
    """
    raw_cells = terrain_corridor.get_grid()
    weather = await weather_service.get_effective_weather()
    
    current_rain = float(weather.get("current_rainfall_mm_hr", 12.0))
    api_11 = float(weather.get("api_11_mm", 45.0))
    soil_moisture = float(weather.get("soil_moisture_vol", 0.52))
    
    # Prepare batch features for vectorized PGML prediction
    records = []
    for c in raw_cells:
        local_twi = float(c["twi"])
        slope_deg = float(c["slope_deg"])
        aspect_deg = float(c["aspect_deg"])
        
        fs = float(compute_factor_of_safety(slope_deg, api_11, local_twi))
        
        records.append({
            "id": c["id"],
            "chainage_start_km": c["chainage_start_km"],
            "chainage_end_km": c["chainage_end_km"],
            "chainage_label": c["chainage_label"],
            "coordinates": c["coordinates"],
            "midpoint": c["midpoint"],
            "elevation_m": c["elevation_m"],
            "slope_deg": slope_deg,
            "aspect_deg": aspect_deg,
            "twi": local_twi,
            "upslope_area_m2": c["upslope_area_m2"],
            "landmark": c["landmark"],
            "lithology": c["lithology"],
            "daily_rainfall_mm": current_rain,
            "api_11": round(api_11, 2),
            "soil_moisture": round(soil_moisture, 3),
            "factor_of_safety": round(fs, 3)
        })
        
    df = pd.DataFrame(records)
    predictions_df = pgml_engine.predict_batch(df)
    
    all_properties = predictions_df.to_dict(orient="records")
    cap_alert_service.evaluate_and_generate_alerts(all_properties, weather)
    
    features = []
    red_count = 0
    orange_count = 0
    yellow_count = 0
    green_count = 0
    
    for row in all_properties:
        coords = row.pop("coordinates")
        lvl = row["risk_level"]
        if lvl == 3:
            red_count += 1
        elif lvl == 2:
            orange_count += 1
        elif lvl == 1:
            yellow_count += 1
        else:
            green_count += 1
            
        fs_val = row["factor_of_safety"]
        if fs_val < 1.0:
            row["clearance_advisory"] = "High debris probability (~400-800 m3). Estimated clearance: 3.5 - 6.0 hrs."
        elif fs_val < 1.15:
            row["clearance_advisory"] = "Potential shallow raveling (~100-250 m3). Pre-position wheel loader."
        else:
            row["clearance_advisory"] = "Clear passage."
            
        features.append({
            "type": "Feature",
            "id": row["id"],
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            },
            "properties": row
        })
        
    return {
        "type": "FeatureCollection",
        "summary": {
            "total_30m_cells": len(features),
            "critical_red_cells": red_count,
            "warning_orange_cells": orange_count,
            "advisory_yellow_cells": yellow_count,
            "normal_green_cells": green_count,
            "overall_hazard_status": (
                "CRITICAL_RED_ALERT" if red_count > 0 else
                ("WARNING_ORANGE" if orange_count > 0 else
                 ("ADVISORY_YELLOW" if yellow_count > 0 else "STABLE_GREEN"))
            ),
            "weather_mode": weather.get("status", "LIVE"),
            "current_rainfall_mm_hr": current_rain,
            "api_11_mm": api_11
        },
        "features": features
    }

@app.get("/api/alerts/latest.xml")
def get_latest_cap_xml():
    """Returns raw OASIS CAP 1.2 XML for NDMA SACHET gateway ingestion."""
    xml_content = cap_alert_service.get_latest_xml()
    return Response(content=xml_content, media_type="application/xml")

@app.get("/api/alerts/active")
def get_active_alerts():
    """Returns active alerts array in JSON format."""
    return {
        "active_alerts": cap_alert_service.get_active_alerts(),
        "latest_xml": cap_alert_service.get_latest_xml()
    }

@app.get("/api/alerts/cap")
def get_cap_alerts():
    return get_active_alerts()

class CitizenReportRequest(BaseModel):
    latitude: float
    longitude: float
    chainage_km: float
    hazard_type: str = "Tension Crack"
    crack_width_cm: float = 3.0
    severity: str = "HIGH"
    observer_role: str = "Citizen Volunteer"
    notes: Optional[str] = "Pavement tension crack observed."
    image_b64_thumbnail: Optional[str] = None
    ai_confidence_score: float = 0.92

@app.post("/api/crowdsource/report")
def submit_citizen_report(payload: CitizenReportRequest):
    new_report = crowdsource_service.add_report(payload.dict())
    clusters_info = crowdsource_service.get_clusters_and_reports()
    return {
        "message": "Citizen incident report registered and verified.",
        "report": new_report,
        "clustering": clusters_info
    }

@app.get("/api/crowdsource/clusters")
def get_crowdsource_clusters():
    return crowdsource_service.get_clusters_and_reports()

@app.get("/api/logistics/depots")
def get_logistics_depots():
    return {"depots": get_all_depots()}

@app.get("/api/logistics/dispatch")
def get_dispatch_recommendation(
    target_km: float = Query(52.5, description="Corridor chainage kilometer"),
    debris_volume_m3: float = Query(450.0, description="Estimated landslide debris volume in m3")
):
    return calculate_logistics_dispatch(target_km, debris_volume_m3)

# Serve Unified Frontend Build
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="SPA index not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
