# 🛰️ BhoomiDrishti-NER: Complete Working Prototype & Function Reference Guide
**Smart India Hackathon 2026 (SIH26001)**  
**Corridor:** NH-106 (Guwahati to Shillong, Meghalaya, km 40.0 to km 70.0)  
**Target:** AI-Based Early Warning and Landslide Risk Monitoring System in NER  

---

## 🌟 1. System Overview & Architecture
BhoomiDrishti-NER is an end-to-end operational Geospatial AI & Physics-Guided Machine Learning (PGML) landslide early warning system for high-risk mountain highways in Northeast India.

- **Backend:** Python 3.11 / FastAPI with Vectorized 1D Deterministic Infinite Slope Factor of Safety ($FS$), 11-Day Antecedent Precipitation Index ($API_{11}$), PGML XGBoost Engine, Open-Meteo live weather telemetry, NDMA OASIS CAP 1.2 XML serializer, BRO logistics route optimizer, and DBSCAN spatial crowdsource clustering.
- **Frontend:** React 19 / Vite / Tailwind CSS / Leaflet Web-GIS dashboard with multi-basemap satellite & topographic layers, real-time 30-meter longitudinal elevation & risk cross-section profile, slide-over geotechnical inspector drawer, and interactive simulation modals.

---

## 🧭 2. Complete List of All Working UI Buttons & Functions (Line by Line)

### 🔹 A. Top Navigation Header (`frontend/src/components/Header.jsx`)
| Button / Element | Location | Working Function & Output |
| :--- | :--- | :--- |
| **`BhoomiDrishti-NER (SIH26001)` Logo** | Top Left | Displays project branding, active highway corridor (`NH-106 Ri-Bhoi km 40-70`), and AI methodology. |
| **`CRITICAL RED ALERT / NORMAL` Badge** | Top Middle | Real-time live status indicator that counts active critical red sectors and switches from green to pulsing red during storm conditions. |
| **`Rainfall (Pt)` Counter** | Top Middle | Displays real-time or simulated rainfall intensity in $\text{mm/hr}$ directly from Open-Meteo or simulation engine. |
| **`Antecedent (API₁₁)` Counter** | Top Middle | Displays the 11-day antecedent saturation decay value computed via $API_{11} = P_t + \sum_{i=1}^{11} (0.84)^i P_{t-i}$. |
| **`Soil Moisture` Counter** | Top Middle | Displays volumetric soil moisture percentage ($0.0\% - 100\%$). |
| **`NDMA CAP 1.2` Button** | Top Right | Opens the **NDMA SACHET / OASIS CAP 1.2 XML Broadcast Modal** showing real-time XML serialization, affected corridor range, and download options. |
| **`BRO Staging` Button** | Top Right | Opens the **Border Roads Organisation (BRO) Heavy Machinery Mobilization Bay Modal** with staging depots and clearance calculators. |
| **`Field PWA` Button** | Top Right | Opens the **Citizen & Highway Patrol Crowdsourcing Modal** with simulated Edge-AI camera tension crack detector and spatial DBSCAN clustering. |

---

### 🔹 B. Live Emergency Alert Ticker (`frontend/src/App.jsx`)
| Button / Element | Location | Working Function & Output |
| :--- | :--- | :--- |
| **`Live Warning Ticker Bar`** | Sub-Header | Automatically displays pulsing red warning banner whenever critical sectors are detected along NH-106. |
| **`View OASIS XML` Button** | Ticker Right | Triggers the NDMA CAP 1.2 Alert Inspector modal directly for rapid incident response review. |

---

### 🔹 C. Interactive 3D Web-GIS Map (`frontend/src/components/CorridorMap.jsx`)
| Button / Element | Location | Working Function & Output |
| :--- | :--- | :--- |
| **`Fit Corridor` Button** | Map Top-Left | Automatically recenters and flies the map viewport to fit the entire 30-km NH-106 corridor from km 40.0 (Nongpoh) to km 70.0 (Barapani). |
| **`OSM Map` Basemap Button** | Map Top-Left | Switches the basemap tile layer to high-detail **OpenStreetMap Standard** with zero watermarks and clear town names. |
| **`Satellite` Basemap Button** | Map Top-Left | Switches the basemap tile layer to high-resolution **Esri World Imagery** satellite mountain terrain. |
| **`Topo` Basemap Button** | Map Top-Left | Switches the basemap tile layer to **OpenTopoMap** with topographic contour lines and elevation shading. |
| **`Dark` Basemap Button** | Map Top-Left | Switches the basemap tile layer to **Tactical Dark Canvas** for high-contrast emergency operations. |
| **`🚜 BRO Bays` Toggle Button** | Map Top-Left | Toggles visibility of BRO heavy equipment staging markers (Nongpoh 103 RCC, Umsning 104 RCC, Barapani Outpost). |
| **`📍 Hotspots` Toggle Button** | Map Top-Left | Toggles visibility of citizen-reported tension crack DBSCAN cluster hotspots with animated pulsing markers. |
| **`30m Road Vector Segments`** | Central Map | 1,000 clickable road segments color-coded by real-time risk (🟢 Normal, 🟡 Advisory, 🟠 Warning, 🔴 Critical). Hovering shows live telemetry tooltip; clicking opens the right Geotechnical Inspector drawer. |
| **`BRO Depot Map Markers`** | Central Map | Interactive markers displaying depot name, chainage kilometer, and readiness time (e.g., 10–15 mins). |
| **`Crowdsource Cluster Markers`** | Central Map | Interactive DBSCAN cluster markers displaying report count and hazard summary. |
| **`Hazard Level Legend`** | Map Bottom-Left | Displays FS threshold color key: Normal ($FS > 1.30$), Advisory ($1.15 \le FS \le 1.30$), Warning ($1.00 \le FS \le 1.15$), Critical ($FS < 1.00$). |

---

### 🔹 D. 30m Longitudinal Elevation & Risk Ribbon (`frontend/src/components/CorridorMap.jsx`)
| Button / Element | Location | Working Function & Output |
| :--- | :--- | :--- |
| **`1,000 30m Chainage Bars`** | Map Bottom | Interactive longitudinal cross-section profile depicting elevation climb from 420m (Nongpoh) to 1,420m (Barapani) across 1,000 discrete 30m cells. Hovering inspects cell telemetry; clicking selects cell for deep geotechnical inspection. |
| **`Chainage Tickers`** | Ribbon Footer | Fast geographical milestone markers: km 40.0 (Nongpoh), km 52.5 (Shangbang Fault), km 63.0 (Umsning Cut), km 70.0 (Barapani Pass). |

---

### 🔹 E. Slide-Over Geotechnical Inspector Drawer (`frontend/src/components/GeotechnicalInspector.jsx`)
| Button / Element | Location | Working Function & Output |
| :--- | :--- | :--- |
| **`Cell Header & Close (X)`** | Drawer Top | Displays selected 30m cell ID (e.g. `NH106-CH52450`), landmark name, chainage range, elevation, and close drawer button. |
| **`Risk Status Badge`** | Drawer Upper | Shows AI hazard classification grade (Stable Regolith, Advisory, High Vulnerability, or Critical Failure). |
| **`Factor of Safety (FS) Gauge`** | Drawer Upper | Real-time 1D Infinite Slope limit equilibrium value with horizontal threshold bar and FS failure line ($FS = 1.0$). |
| **`PGML Constraint Guard`** | Drawer Middle | Enforces hard physical boundaries (suppresses false alarms when $FS > 1.25$; elevates warnings when $FS < 0.95$). |
| **`11-Day API Precipitation Chart`** | Drawer Middle | Recharts interactive bar chart displaying exponential decaying rainfall weights ($0.84^i$) leading up to today's downpour. |
| **`Geomechanical Parameters Grid`** | Drawer Lower | Shows slope angle ($\beta$), aspect orientation, Topographic Wetness Index ($TWI$), pore water pressure ($u$), cohesion ($c'=12\text{ kPa}$), and friction angle ($\phi'=28^\circ$). |
| **`BRO Clearance Advisory`** | Drawer Lower | Provides estimated debris volume ($\text{m}^3$) and predicted clearance time in hours. |
| **`Open BRO Staging Dispatch Bay`** | Drawer Bottom | Opens the BRO equipment staging modal pre-configured with the selected chainage kilometer. |

---

### 🔹 F. Storm Deluge Simulator (`frontend/src/components/StormSimulator.jsx`)
| Button / Element | Location | Working Function & Output |
| :--- | :--- | :--- |
| **`⚡ Open Storm Simulator`** | Map Top-Right | Expands the floating cloudburst and monsoon deluge simulation control panel. |
| **`Normal Monsoon (15 mm/hr)`** | Simulator Panel | Preset scenario applying steady monsoon rainfall across 3 antecedent days. |
| **`5-Day Soaking (45 mm/hr)`** | Simulator Panel | Preset scenario applying prolonged saturation and elevated pore pressure over 6 days. |
| **`Severe Cloudburst (110 mm/hr)`**| Simulator Panel | Preset scenario applying high-intensity rainfall over 8 days with localized failure triggers. |
| **`150mm Deluge Surge (150 mm/hr)`**| Simulator Panel | Preset scenario triggering maximum catastrophic cloudburst along high-slope escarpments. |
| **`Rainfall Intensity Slider`** | Simulator Panel | Dynamic slider ($0 - 250\text{ mm/hr}$) for custom meteorological stress testing. |
| **`Antecedent Days Slider`** | Simulator Panel | Dynamic slider ($1 - 15\text{ days}$) controlling the $API_{11}$ saturation memory window. |
| **`Trigger Cloudburst Surge` Button**| Simulator Panel | Executes `/api/simulation/trigger-storm` backend POST request, immediately recalculating all 1,000 cells via PGML. |
| **`Reset to Live Open-Meteo` Button**| Simulator Panel | Executes `/api/simulation/reset` backend POST request, reverting weather telemetry to live Ri-Bhoi satellite/radar feeds. |

---

### 🔹 G. NDMA SACHET / OASIS CAP 1.2 Alert Modal (`frontend/src/components/CAPAlertModal.jsx`)
| Button / Element | Location | Working Function & Output |
| :--- | :--- | :--- |
| **`Active Alert Banner`** | Modal Top | Shows alert identifier, headline, severity (`Extreme`), urgency (`Immediate`), affected corridor, and min FS. |
| **`Copy XML` Button** | Modal Middle | Copies the raw standardized OASIS CAP 1.2 XML payload to clipboard for testing NDMA gateway integrations. |
| **`Download .xml` Button** | Modal Middle | Downloads the formatted `.xml` alert file timestamped for official disaster management archive. |
| **`Raw XML Code Viewer`** | Modal Middle | Scrollable syntax-highlighted XML viewer showing full `<alert>` structure, polygons, and severity parameters. |
| **`Close / Escape`** | Modal Header/Footer | Closes the modal and returns focus to the GIS map. |

---

### 🔹 H. BRO Staging Logistics Modal (`frontend/src/components/LogisticsModal.jsx`)
| Button / Element | Location | Working Function & Output |
| :--- | :--- | :--- |
| **`Staging Depots Overview`** | Modal Upper | Cards for **Nongpoh Base (103 RCC)**, **Umsning Base (104 RCC)**, and **Barapani Base** showing excavator, backhoe, tipper, and crane counts. |
| **`Target Chainage Slider`** | Modal Middle | Adjusts the target landslide incident location between km 40.0 and km 70.0. |
| **`Debris Volume Slider`** | Modal Middle | Adjusts expected rockfall/debris volume ($100 - 2,500\text{ m}^3$). |
| **`Dynamic Dispatch Card`** | Modal Lower | Computes the nearest optimal depot, transit distance ($\text{km}$), transit ETA ($\text{mins}$), and clearance time ($\text{hours}$). |
| **`Dispatch Heavy Clearance Convoy`**| Modal Bottom | Simulates mobilization order and generates an official BRO convoy dispatch tracking ID (e.g. `BRO-CONVOY-7421`). |

---

### 🔹 I. Field Crowdsourcing & Tension Crack Detector (`frontend/src/components/CrowdsourceModal.jsx`)
| Button / Element | Location | Working Function & Output |
| :--- | :--- | :--- |
| **`Simulated Edge-AI Camera Viewfinder`** | Modal Left | Interactive simulated mobile camera showing tension crack bounding box, crack width, and YOLOv8 confidence ($95.4\%$). |
| **`Chainage km Input`** | Modal Right | Form input for geotagged road kilometer marker. |
| **`Crack Width (cm) Input`** | Modal Right | Measurement input for geotechnical fissure aperture width. |
| **`Hazard Classification Dropdown`** | Modal Right | Options: Tension Crack, Retaining Wall Bulge, Rockfall Runout, Culvert Clogging, Debris Slump. |
| **`Severity Level Dropdown`** | Modal Right | Options: LOW, MEDIUM, HIGH, CRITICAL. |
| **`Reporting Authority Dropdown`** | Modal Right | Options: Citizen Volunteer, BRO Highway Patrol, Meghalaya Police Traffic, PWD Engineer. |
| **`Submit Geotagged Report` Button** | Modal Right | Posts report to `/api/crowdsource/report`, executing spatial DBSCAN clustering and updating live hotspots. |
| **`Active DBSCAN Clusters List`** | Modal Bottom | Displays clustered incidents within 500m proximity. |

---

## ⚙️ 3. Backend API Endpoints & Scientific Physics Formulations

### 1. 1D Infinite Slope Geomechanical Model (`backend/ml/physics.py`)
Calculates the factor of safety ($FS$) resisting shear failure along the slope mantle:
$$FS = \frac{c' + (\gamma z \cos^2\beta - u)\tan\phi'}{\gamma z \sin\beta \cos\beta}$$
- $c' = 12.0\,\text{kPa}$ (effective soil cohesion)
- $\phi' = 28.0^\circ$ (effective angle of internal friction)
- $\gamma = 19.0\,\text{kN/m}^3$ (unit soil weight)
- $z = 2.0\,\text{m}$ (shear failure plane depth)
- $\beta = \text{slope gradient angle}$ (from DEM)
- $u = \text{pore water pressure derived from } API_{11} \text{ and } TWI$

### 2. 11-Day Antecedent Precipitation Index ($API_{11}$)
$$API_{11} = P_t + \sum_{i=1}^{11} (0.84)^i P_{t-i}$$
Captures soil saturation memory across the preceding 11 monsoon days.

### 3. Physics-Guided Machine Learning (PGML) Guard (`backend/ml/model.py`)
- Vectorized XGBoost Classifier trained on 5,000 synthetic geomorphic and meteorological profiles along the Meghalaya plateau.
- Hard physics boundary: Red alarms are strictly suppressed when $FS > 1.25$ to eliminate false positives.

### 4. REST API Endpoints (`backend/main.py`)
- `GET /health`: System health and model status check.
- `GET /api/weather/current`: Live Open-Meteo or simulated weather telemetry.
- `POST /api/simulation/trigger-storm`: Overrides meteorological conditions with cloudburst surge.
- `POST /api/simulation/reset`: Reverts to live Open-Meteo telemetry.
- `GET /api/corridor/grid`: Full GeoJSON of 1,000 30m cells with PGML risk predictions and parameters.
- `GET /api/alerts/latest.xml`: Standardized OASIS CAP 1.2 XML feed for NDMA SACHET gateway.
- `GET /api/alerts/active`: Active alerts summary in JSON.
- `POST /api/crowdsource/report`: Citizen hazard submission with DBSCAN clustering.
- `GET /api/crowdsource/clusters`: Spatial hazard hotspot clusters.
- `GET /api/logistics/depots`: BRO staging depot inventory.
- `GET /api/logistics/dispatch`: Dynamic logistics routing & ETA calculator.

---

## 🚀 4. How to Run the Complete System
```bash
# 1. Activate Python virtual environment and launch unified backend & static server
./backend/venv/bin/python backend/run_server.py

# 2. Open dashboard in browser
http://localhost:8000/
```
