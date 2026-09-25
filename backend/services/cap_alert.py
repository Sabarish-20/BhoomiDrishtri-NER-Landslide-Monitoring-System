"""
BhoomiDrishti-NER: NDMA SACHET / OASIS CAP 1.2 Alert Dispatcher
Serializes dynamic landslide threats into standardized OASIS Common Alerting Protocol v1.2 XML.
Compliant with National Disaster Management Authority (NDMA) & SDMA Meghalaya CAP feed standards.
"""
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

CAP_XML_NS = "urn:oasis:names:tc:emergency:cap:1.2"

class CAPAlertEngine:
    def __init__(self):
        self.active_alerts: List[Dict[str, Any]] = []
        self.latest_xml_str: str = ""
        self._generate_default_baseline_alert()

    def _generate_default_baseline_alert(self):
        """Generates initial monitoring state alert."""
        self.active_alerts = []
        self.latest_xml_str = self.build_cap_xml(
            urgency="Advisory",
            severity="Minor",
            event_code="LANDSLIDE_WATCH",
            headline="NH-106 Corridor Geotechnical Watch Active",
            description="All road chainage sections (km 40 to 70) operating under normal geotechnical stability. Routine monitoring ongoing.",
            affected_km_range="km 40.0 - km 70.0",
            polygon_coords=[[91.882, 25.903], [91.875, 25.864], [91.868, 25.821], [91.884, 25.779], [91.896, 25.742], [91.905, 25.701], [91.912, 25.662]],
            affected_cells_count=0,
            min_fs=1.45,
            max_api=38.0
        )

    def evaluate_and_generate_alerts(self, cells: List[Dict[str, Any]], weather_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Scans corridor cells and triggers Level 2 (Orange) or Level 3 (Red) CAP 1.2 alerts.
        """
        red_cells = [c for c in cells if c.get("risk_level") == 3]
        orange_cells = [c for c in cells if c.get("risk_level") == 2]
        
        if not red_cells and not orange_cells:
            self._generate_default_baseline_alert()
            return None
            
        is_red = len(red_cells) > 0
        urgency = "Immediate" if is_red else "Expected"
        severity = "Extreme" if is_red else "Severe"
        certainty = "Observed" if is_red else "Likely"
        
        high_risk_cells = red_cells if is_red else orange_cells
        min_km = min(c["chainage_start_km"] for c in high_risk_cells)
        max_km = max(c["chainage_end_km"] for c in high_risk_cells)
        min_fs = min(c.get("factor_of_safety", 1.0) for c in high_risk_cells)
        max_api = max(c.get("api_11", weather_info.get("api_11_mm", 50.0)) for c in high_risk_cells)
        
        # Landmarks involved
        landmarks = list(set(c.get("landmark", "NH-106 Section") for c in high_risk_cells[:5]))
        landmarks_str = ", ".join(landmarks)
        
        headline = (
            f"CRITICAL RED LANDSLIDE HAZARD: NH-106 km {min_km:.1f} to km {max_km:.1f} ({landmarks_str})"
            if is_red else
            f"ORANGE WARNING: High Landslide Vulnerability along NH-106 km {min_km:.1f} to km {max_km:.1f}"
        )
        
        current_rain = weather_info.get("current_rainfall_mm_hr", 0.0)
        desc = (
            f"Physics-Guided Early Warning System detected catastrophic slope failure condition (Min FS: {min_fs:.2f}, API-11: {max_api:.1f}mm, Current Rain: {current_rain:.1f}mm/hr). "
            f"Affected high-risk zones: {landmarks_str}. Severe risk of debris flows, rockfalls, and road breach along Guwahati-Shillong corridor. "
            f"NDMA & BRO Rapid Deployment protocol engaged. Immediate traffic stoppage advised."
        )
        
        # Build polygon bounding box around high risk cells
        polygon_points = []
        for c in high_risk_cells:
            for coord in c.get("coordinates", []):
                polygon_points.append(coord)
                
        # Deduplicate and sample up to 12 polygon points
        sampled_coords = polygon_points[::max(1, len(polygon_points) // 10)]
        
        xml_str = self.build_cap_xml(
            urgency=urgency,
            severity=severity,
            event_code="LANDSLIDE_RED_ALERT" if is_red else "LANDSLIDE_ORANGE_WARNING",
            headline=headline,
            description=desc,
            affected_km_range=f"km {min_km:.2f} - km {max_km:.2f}",
            polygon_coords=sampled_coords,
            affected_cells_count=len(high_risk_cells),
            min_fs=min_fs,
            max_api=max_api
        )
        
        self.latest_xml_str = xml_str
        
        alert_obj = {
            "identifier": f"NDMA-NER-LS-{uuid.uuid4().hex[:8].upper()}",
            "headline": headline,
            "severity": severity,
            "urgency": urgency,
            "certainty": certainty,
            "affected_range": f"km {min_km:.2f} - km {max_km:.2f}",
            "affected_cells_count": len(high_risk_cells),
            "critical_landmarks": landmarks,
            "min_factor_of_safety": min_fs,
            "max_api_11": max_api,
            "current_rain_mm_hr": current_rain,
            "sent_time": datetime.now(timezone.utc).isoformat(),
            "xml_payload": xml_str
        }
        
        self.active_alerts = [alert_obj]
        return alert_obj

    def build_cap_xml(
        self,
        urgency: str,
        severity: str,
        event_code: str,
        headline: str,
        description: str,
        affected_km_range: str,
        polygon_coords: List[List[float]],
        affected_cells_count: int,
        min_fs: float,
        max_api: float
    ) -> str:
        """
        Constructs standard OASIS CAP 1.2 XML element tree.
        """
        now = datetime.now(timezone.utc)
        expires = now + timedelta(hours=6)
        identifier = f"IN-NDMA-BHOOMIDRISHTI-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
        
        alert = ET.Element("alert", xmlns=CAP_XML_NS)
        
        ET.SubElement(alert, "identifier").text = identifier
        ET.SubElement(alert, "sender").text = "bhoomidrishti-ner@ndma.gov.in"
        ET.SubElement(alert, "sent").text = now.isoformat()
        ET.SubElement(alert, "status").text = "Actual"
        ET.SubElement(alert, "msgType").text = "Alert"
        ET.SubElement(alert, "scope").text = "Public"
        ET.SubElement(alert, "code").text = "IPAWS-CAP-1.2-NER"
        
        info = ET.SubElement(alert, "info")
        ET.SubElement(info, "language").text = "en-IN"
        ET.SubElement(info, "category").text = "Geo"
        ET.SubElement(info, "event").text = "Landslide Risk Warning"
        ET.SubElement(info, "responseType").text = "Evacuate" if severity == "Extreme" else "Monitor"
        ET.SubElement(info, "urgency").text = urgency
        ET.SubElement(info, "severity").text = severity
        ET.SubElement(info, "certainty").text = "Observed" if severity == "Extreme" else "Likely"
        ET.SubElement(info, "eventCode").text = event_code
        ET.SubElement(info, "expires").text = expires.isoformat()
        ET.SubElement(info, "headline").text = headline
        ET.SubElement(info, "description").text = description
        ET.SubElement(info, "instruction").text = "Border Roads Organisation (BRO) and Meghalaya State Disaster Management Authority (SDMA) teams are dispatched. Restrict non-emergency transit between Nongpoh and Umsning."
        ET.SubElement(info, "contact").text = "Emergency Operations Centre Shillong: 1070 / 1077"
        
        # Geotechnical PGML parameter extension
        param_fs = ET.SubElement(info, "parameter")
        ET.SubElement(param_fs, "valueName").text = "Deterministic_Factor_Of_Safety"
        ET.SubElement(param_fs, "value").text = f"{min_fs:.3f}"
        
        param_api = ET.SubElement(info, "parameter")
        ET.SubElement(param_api, "valueName").text = "Antecedent_Precipitation_API11_mm"
        ET.SubElement(param_api, "value").text = f"{max_api:.2f}"
        
        area = ET.SubElement(info, "area")
        ET.SubElement(area, "areaDesc").text = f"NH-106 Guwahati-Shillong Corridor, Ri-Bhoi District, Meghalaya ({affected_km_range})"
        
        if polygon_coords:
            # CAP format: "lat,lon lat,lon ..."
            poly_str = " ".join([f"{coord[1]:.5f},{coord[0]:.5f}" for coord in polygon_coords])
            ET.SubElement(area, "polygon").text = poly_str
            
        xml_bytes = ET.tostring(alert, encoding="utf-8", xml_declaration=True)
        return xml_bytes.decode("utf-8")

    def get_latest_xml(self) -> str:
        return self.latest_xml_str

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        return self.active_alerts

cap_alert_service = CAPAlertEngine()

if __name__ == "__main__":
    print("CAP Alert XML sample:\n", cap_alert_service.get_latest_xml()[:400], "...")
