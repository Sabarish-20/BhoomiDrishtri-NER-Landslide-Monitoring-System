"""
BhoomiDrishti-NER: Automated Unit & Integration Tests
Validates Geotechnical Physics, PGML Model Constraints, CAP 1.2 XML, and API Endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.ml.physics import compute_api_11, compute_factor_of_safety, compute_pore_water_pressure
from backend.ml.model import pgml_engine
from backend.services.cap_alert import cap_alert_service
from backend.services.crowdsource import crowdsource_service

client = TestClient(app)

def test_api_11_computation():
    """Verify 11-day Antecedent Precipitation Index formula."""
    current_p = 50.0
    past_11 = [20.0] * 11
    # API = 50 + sum_{i=1}^{11} (0.84)^i * 20
    api = compute_api_11(current_p, past_11)
    assert api > 50.0
    assert api < 200.0

def test_factor_of_safety_physics():
    """Verify 1D Infinite Slope FS response to slope steepness and rainfall saturation."""
    # Gentle slope (15 deg) under dry conditions -> high FS
    fs_gentle = compute_factor_of_safety(slope_deg=15.0, api_11=10.0, twi=4.0)
    assert fs_gentle > 2.0
    
    # Steep slope (48 deg) under extreme saturation (API_11 = 160) -> failure FS < 1.0
    fs_steep_saturated = compute_factor_of_safety(slope_deg=48.0, api_11=160.0, twi=10.0)
    assert fs_steep_saturated < 1.0

def test_physics_boundary_rule_suppression():
    """Verify that if FS > 1.25, the PGML engine suppresses false Red/Orange alerts."""
    prediction = pgml_engine.predict_single(
        slope_deg=22.0,
        aspect_deg=90.0,
        twi=4.0,
        daily_rainfall_mm=100.0, # High rainfall, but stable gentle slope
        api_11=120.0,
        soil_moisture=0.6,
        fs=1.45 # Hard high FS
    )
    assert prediction["risk_level"] <= 1, f"Expected risk_level <= 1 due to FS=1.45, got {prediction['risk_level']}"

def test_cap_alert_xml_structure():
    """Verify OASIS CAP 1.2 XML compliance."""
    xml_str = cap_alert_service.get_latest_xml()
    assert "<alert xmlns=\"urn:oasis:names:tc:emergency:cap:1.2\">" in xml_str
    assert "<identifier>" in xml_str
    assert "<event>Landslide Risk Warning</event>" in xml_str
    assert "<headline>" in xml_str

def test_crowdsource_dbscan_clustering():
    """Verify spatial DBSCAN clustering groups nearby reports."""
    clusters_res = crowdsource_service.get_clusters_and_reports()
    assert clusters_res["total_reports"] >= 3
    assert "clusters" in clusters_res

def test_api_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["total_cells"] > 800

def test_api_corridor_grid():
    res = client.get("/api/corridor/grid")
    assert res.status_code == 200
    geojson = res.json()
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) > 800
    first_feat = geojson["features"][0]
    assert "factor_of_safety" in first_feat["properties"]
    assert "risk_level" in first_feat["properties"]

def test_api_storm_trigger_and_reset():
    # Trigger cloudburst
    trigger_res = client.post("/api/simulation/trigger-storm", json={
        "rainfall_mm_hr": 145.0,
        "antecedent_days": 8,
        "event_name": "Severe Test Cloudburst"
    })
    assert trigger_res.status_code == 200
    data = trigger_res.json()
    assert data["weather_state"]["is_simulation"] is True
    
    # Check updated grid reflecting critical risk
    grid_res = client.get("/api/corridor/grid")
    grid_data = grid_res.json()
    assert grid_data["summary"]["critical_red_cells"] > 0
    
    # Reset
    reset_res = client.post("/api/simulation/reset")
    assert reset_res.status_code == 200
