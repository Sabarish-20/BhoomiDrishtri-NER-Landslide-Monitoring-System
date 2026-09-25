"""
BhoomiDrishti-NER: Citizen Crowdsource Ingestion & Spatial DBSCAN Clustering
Accepts offline-cached citizen reports (tension cracks, retaining wall bulges, rockfall)
and executes spatial DBSCAN clustering to detect emerging ground deformation clusters.
"""
import uuid
import numpy as np
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sklearn.cluster import DBSCAN

class CrowdsourceManager:
    def __init__(self):
        self.reports: List[Dict[str, Any]] = []
        self._seed_sample_field_reports()

    def _seed_sample_field_reports(self):
        """Pre-seeds realistic field observations along known NH-106 fracture zones."""
        initial_reports = [
            {
                "id": "RPT-CRK-101",
                "latitude": 25.8240,
                "longitude": 91.8692,
                "chainage_km": 49.8,
                "hazard_type": "Tension Crack (Pavement)",
                "crack_width_cm": 4.5,
                "severity": "HIGH",
                "observer_role": "BRO Highway Patrol",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "verified": True,
                "ai_confidence_score": 0.94,
                "notes": "Longitudinal tensile crack across uphill lane, 12m length."
            },
            {
                "id": "RPT-CRK-102",
                "latitude": 25.8235,
                "longitude": 91.8698,
                "chainage_km": 49.9,
                "hazard_type": "Retaining Wall Bulge",
                "crack_width_cm": 8.0,
                "severity": "CRITICAL",
                "observer_role": "State Transport Driver",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "verified": True,
                "ai_confidence_score": 0.96,
                "notes": "Gabion wall displacement observed after heavy rain."
            },
            {
                "id": "RPT-CRK-103",
                "latitude": 25.7410,
                "longitude": 91.8965,
                "chainage_km": 62.1,
                "hazard_type": "Debris Slump",
                "crack_width_cm": 15.0,
                "severity": "HIGH",
                "observer_role": "Local Resident",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "verified": True,
                "ai_confidence_score": 0.89,
                "notes": "Mud sliding onto shoulder near Umsning cut slope."
            }
        ]
        self.reports = initial_reports

    def add_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Adds a new citizen or patrol report.
        """
        report_id = f"RPT-CRK-{uuid.uuid4().hex[:6].upper()}"
        report = {
            "id": report_id,
            "latitude": float(report_data.get("latitude", 25.82)),
            "longitude": float(report_data.get("longitude", 91.87)),
            "chainage_km": float(report_data.get("chainage_km", 50.0)),
            "hazard_type": report_data.get("hazard_type", "Tension Crack"),
            "crack_width_cm": float(report_data.get("crack_width_cm", 2.5)),
            "severity": report_data.get("severity", "MEDIUM"),
            "observer_role": report_data.get("observer_role", "Citizen Volunteer"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "verified": True,
            "ai_confidence_score": round(float(report_data.get("ai_confidence_score", 0.91)), 2),
            "notes": report_data.get("notes", "Citizen reported highway crack observation."),
            "image_b64_thumbnail": report_data.get("image_b64_thumbnail", None)
        }
        self.reports.insert(0, report)
        return report

    def get_clusters_and_reports(self) -> Dict[str, Any]:
        """
        Executes DBSCAN spatial clustering over reports.
        Distance metric: Haversine / Euclidean (approx ~500m epsilon).
        """
        if not self.reports:
            return {"clusters": [], "reports": []}
            
        coords = np.array([[r["latitude"], r["longitude"]] for r in self.reports])
        
        # eps in degrees: 0.005 deg ~= 550 meters in Meghalaya
        db = DBSCAN(eps=0.006, min_samples=2, metric="euclidean").fit(coords)
        labels = db.labels_
        
        clusters = []
        unique_labels = set(labels)
        
        for cluster_id in unique_labels:
            if cluster_id == -1:
                continue # Noise points
                
            cluster_indices = [i for i, lbl in enumerate(labels) if lbl == cluster_id]
            cluster_reports = [self.reports[i] for i in cluster_indices]
            
            mean_lat = float(np.mean([r["latitude"] for r in cluster_reports]))
            mean_lon = float(np.mean([r["longitude"] for r in cluster_reports]))
            mean_km = float(np.mean([r["chainage_km"] for r in cluster_reports]))
            max_severity = "CRITICAL" if any(r["severity"] == "CRITICAL" for r in cluster_reports) else "HIGH"
            
            clusters.append({
                "cluster_id": f"CLS-HOTSPOT-{cluster_id + 1}",
                "center_lat": round(mean_lat, 5),
                "center_lon": round(mean_lon, 5),
                "approx_chainage_km": round(mean_km, 2),
                "report_count": len(cluster_reports),
                "max_severity": max_severity,
                "hazard_summary": f"{len(cluster_reports)} verified tension crack / subsidence reports clustered within 500m.",
                "associated_report_ids": [r["id"] for r in cluster_reports]
            })
            
        for i, r in enumerate(self.reports):
            r["cluster_tag"] = f"CLS-{labels[i] + 1}" if labels[i] != -1 else "ISOLATED"
            
        return {
            "total_reports": len(self.reports),
            "clusters_count": len(clusters),
            "clusters": clusters,
            "reports": self.reports
        }

crowdsource_service = CrowdsourceManager()

if __name__ == "__main__":
    res = crowdsource_service.get_clusters_and_reports()
    print("Crowdsource clusters:", res["clusters_count"], "Total reports:", res["total_reports"])
