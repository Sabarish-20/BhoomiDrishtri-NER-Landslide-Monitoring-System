"""
Single-command launcher for BhoomiDrishti-NER (Combined Backend + Web-GIS Frontend)
SIH26001 Demo System: AI-Based Early Warning and Landslide Risk Monitoring System in NER
"""
import os
import sys
import uvicorn

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if __name__ == "__main__":
    print("=" * 70)
    print("  🚀 Launching BhoomiDrishti-NER (SIH26001 Unified System)")
    print("  Corridor: NH-106 (Guwahati to Shillong, km 40 to 70)")
    print("  Unified Web-GIS Dashboard: http://localhost:8000/")
    print("  FastAPI Swagger API Docs:  http://localhost:8000/docs")
    print("  NDMA CAP 1.2 XML Feed:     http://localhost:8000/api/alerts/latest.xml")
    print("=" * 70)
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
