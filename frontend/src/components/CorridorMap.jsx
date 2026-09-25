import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Compass, Eye, ShieldAlert, Wrench, AlertTriangle, MapPin, ZoomIn, ZoomOut, RefreshCw, BarChart2, Navigation, Satellite, Sun, Moon } from 'lucide-react';

const CARTO_KEY = import.meta.env.VITE_CARTO_API_KEY || 'cb1_3xoj_1_f33b361506cf6c1f100c6055';

// Robust Basemap Providers with multi-subdomain CDN fallbacks
const BASEMAP_PROVIDERS = {
  dark: {
    name: 'CARTO Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '© <a href="https://carto.com/">CARTO</a> | © OpenStreetMap contributors'
    }
  },
  voyager: {
    name: 'CARTO Voyager (Topographic)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '© <a href="https://carto.com/">CARTO</a> | © OpenStreetMap'
    }
  },
  satellite: {
    name: 'Esri Satellite & Elevation',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 18,
      attribution: '© Esri, Maxar, Earthstar Geographics'
    }
  },
  osm: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      subdomains: 'abc',
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }
  }
};

const BRO_DEPOTS = [
  { name: 'Nongpoh Base (103 RCC)', km: 41.2, lon: 91.8810, lat: 25.8980, color: '#3B82F6', icon: '🚜', ready: '15 Mins' },
  { name: 'Umsning Depot (104 RCC)', km: 62.5, lon: 91.8980, lat: 25.7350, color: '#3B82F6', icon: '🛠️', ready: '10 Mins' },
  { name: 'Barapani Outpost', km: 69.8, lon: 91.9110, lat: 25.6650, color: '#3B82F6', icon: '🚧', ready: '20 Mins' }
];

export default function CorridorMap({
  corridorData,
  selectedSegment,
  onSelectSegment,
  crowdsourceData,
  onOpenCrowdsource,
  onOpenCapModal
}) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const tileLayerRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [activeProvider, setActiveProvider] = useState('dark');
  const [showDepots, setShowDepots] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [hoveredInfo, setHoveredInfo] = useState(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Centroid of NH-106 corridor (Ri-Bhoi between Nongpoh & Shillong)
    const map = L.map(mapContainer.current, {
      center: [25.790, 91.885],
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Tile Layer
    const provider = BASEMAP_PROVIDERS.dark;
    tileLayerRef.current = L.tileLayer(provider.url, provider.options).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Switch Tile Provider
  const handleProviderChange = (providerKey) => {
    setActiveProvider(providerKey);
    if (!mapInstance.current) return;

    if (tileLayerRef.current) {
      mapInstance.current.removeLayer(tileLayerRef.current);
    }

    const provider = BASEMAP_PROVIDERS[providerKey];
    tileLayerRef.current = L.tileLayer(provider.url, provider.options).addTo(mapInstance.current);
    
    // Ensure road layers stay on top
    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.bringToFront();
    }
  };

  // Render Corridor Road Segments GeoJSON
  useEffect(() => {
    if (!mapInstance.current || !corridorData) return;

    const map = mapInstance.current;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    const geoLayer = L.geoJSON(corridorData, {
      style: (feature) => {
        const props = feature.properties || {};
        const risk = props.risk_level || 0;
        const color = props.color || '#10B981';
        const isSelected = selectedSegment?.id === props.id;

        return {
          color: isSelected ? '#FFFFFF' : color,
          weight: isSelected ? 8 : (risk >= 3 ? 6.5 : (risk === 2 ? 5 : 4)),
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};

        layer.on({
          click: () => {
            onSelectSegment(props);
          },
          mouseover: (e) => {
            setHoveredInfo(props);
            const target = e.target;
            target.setStyle({ weight: 9, opacity: 1 });
            target.bringToFront();
          },
          mouseout: (e) => {
            setHoveredInfo(null);
            if (geojsonLayerRef.current) {
              geojsonLayerRef.current.resetStyle(e.target);
            }
          }
        });
      }
    }).addTo(map);

    geojsonLayerRef.current = geoLayer;
  }, [corridorData, selectedSegment, onSelectSegment]);

  // Render Markers (BRO Depots & Crowdsource Clusters)
  useEffect(() => {
    if (!mapInstance.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    // BRO Depots
    if (showDepots) {
      BRO_DEPOTS.forEach((depot) => {
        const customIcon = L.divIcon({
          className: 'custom-bro-marker',
          html: `
            <div class="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/95 border border-blue-500/80 shadow-xl text-[11px] font-bold text-blue-300 backdrop-blur-md cursor-pointer hover:scale-110 transition-transform whitespace-nowrap">
              <span>${depot.icon}</span>
              <span>${depot.name.split(' ')[0]}</span>
            </div>
          `,
          iconSize: [100, 30],
          iconAnchor: [50, 15]
        });

        const marker = L.marker([depot.lat, depot.lon], { icon: customIcon })
          .bindPopup(`
            <div class="p-2 space-y-1 text-xs">
              <div class="font-bold text-blue-400">${depot.name}</div>
              <div class="text-slate-300 font-mono">Chainage: km ${depot.km}</div>
              <div class="text-emerald-400 font-semibold">⚡ Readiness: ${depot.ready}</div>
            </div>
          `);

        markersGroup.addLayer(marker);
      });
    }

    // Crowdsource Hotspots
    if (showClusters && crowdsourceData?.clusters) {
      crowdsourceData.clusters.forEach((cluster) => {
        const customClusterIcon = L.divIcon({
          className: 'custom-cluster-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="absolute w-8 h-8 rounded-full bg-red-500/40 animate-ping"></div>
              <div class="relative w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                ${cluster.report_count}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([cluster.center_lat, cluster.center_lon], { icon: customClusterIcon })
          .on('click', () => {
            onOpenCrowdsource();
          })
          .bindPopup(`
            <div class="p-2 space-y-1 text-xs">
              <div class="font-bold text-red-400">${cluster.cluster_id}</div>
              <div class="text-slate-200">${cluster.hazard_summary}</div>
              <div class="text-[10px] text-slate-400 font-mono">Approx km ${cluster.approx_chainage_km}</div>
            </div>
          `);

        markersGroup.addLayer(marker);
      });
    }
  }, [showDepots, showClusters, crowdsourceData, onOpenCrowdsource]);

  const fitCorridor = () => {
    if (!mapInstance.current) return;
    mapInstance.current.flyTo([25.790, 91.885], 11, { duration: 1.2 });
  };

  const features = corridorData?.features || [];

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col select-none">
      {/* Top Floating Map Controls */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-2xl">
          {/* Fit View Button */}
          <button
            onClick={fitCorridor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-700/60"
            title="Recenter to NH-106 Corridor"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fit Corridor</span>
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          {/* Basemap Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-lg border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-cyan-400 ml-1" />
            <span className="text-[10px] text-slate-400 font-semibold mr-1">BASEMAP:</span>
            
            <button
              onClick={() => handleProviderChange('dark')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                activeProvider === 'dark' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="CARTO Dark Matter (Tactical GIS)"
            >
              CARTO Dark
            </button>

            <button
              onClick={() => handleProviderChange('voyager')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                activeProvider === 'voyager' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="CARTO Voyager (Topographic Contours)"
            >
              Voyager
            </button>

            <button
              onClick={() => handleProviderChange('satellite')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                activeProvider === 'satellite' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Esri Satellite & Topography"
            >
              Satellite
            </button>

            <button
              onClick={() => handleProviderChange('osm')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                activeProvider === 'osm' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="OpenStreetMap Standard"
            >
              OSM
            </button>
          </div>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          {/* BRO & Hotspot Toggles */}
          <button
            onClick={() => setShowDepots(!showDepots)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              showDepots ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🚜 BRO Bays
          </button>

          <button
            onClick={() => setShowClusters(!showClusters)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              showClusters ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            📍 Hotspots ({crowdsourceData?.clusters?.length || 0})
          </button>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="flex-1 w-full relative">
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Interactive 30m Longitudinal Elevation & Risk Cross-Section Ribbon */}
      <div className="h-36 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-xl p-3 z-[400] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              NH-106 Longitudinal Chainage Profile (km 40.0 → km 70.0)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">1,000 Cells @ 30m Step</span>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-slate-400">Nongpoh: <b className="text-white">420m</b></span>
            <span>→</span>
            <span className="text-slate-400">Shillong Plateau: <b className="text-cyan-300">1,420m</b></span>
          </div>
        </div>

        {/* 30m Chainage Interactive Ribbon */}
        <div className="relative w-full h-14 bg-slate-950 rounded-lg border border-slate-800 flex items-end p-1 overflow-x-auto gap-[1px]">
          {features.length > 0 ? (
            features.map((feat, idx) => {
              const props = feat.properties;
              const isSelected = selectedSegment?.id === props.id;
              const elevRatio = ((props.elevation_m || 400) - 400) / 1050;
              const barHeight = Math.max(12, Math.min(48, elevRatio * 44 + 8));

              return (
                <div
                  key={props.id || idx}
                  onClick={() => onSelectSegment(props)}
                  onMouseEnter={() => setHoveredInfo(props)}
                  onMouseLeave={() => setHoveredInfo(null)}
                  className={`flex-1 min-w-[2px] transition-all cursor-pointer rounded-t-sm hover:brightness-150 ${
                    isSelected ? 'ring-2 ring-white z-20 scale-y-110' : ''
                  }`}
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: props.color || '#10B981',
                    opacity: isSelected ? 1 : 0.85
                  }}
                  title={`${props.chainage_label} | Elev: ${props.elevation_m}m | FS: ${props.factor_of_safety}`}
                />
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Loading 30m road chainage telemetry...
            </div>
          )}
        </div>

        {/* Chainage Ticker Markers */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
          <span>km 40.0 (Nongpoh Entry)</span>
          <span className="text-red-400 font-bold">km 52.5 (Shangbang Fault)</span>
          <span className="text-orange-400 font-bold">km 63.0 (Umsning Cut)</span>
          <span>km 70.0 (Barapani Pass)</span>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredInfo && (
        <div className="absolute top-16 left-4 z-[500] p-3 rounded-xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-md shadow-2xl pointer-events-none min-w-[240px] animate-fade-in">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold text-white tracking-wide">{hoveredInfo.landmark || hoveredInfo.id}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${hoveredInfo.color}25`, color: hoveredInfo.color, border: `1px solid ${hoveredInfo.color}60` }}
            >
              {hoveredInfo.risk_name || 'Risk Evaluation'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div>Chainage: <span className="font-semibold text-white">{hoveredInfo.chainage_label}</span></div>
            <div>Slope Angle: <span className="font-semibold text-white">{hoveredInfo.slope_deg}°</span></div>
            <div>Factor of Safety: <span className="font-semibold" style={{ color: hoveredInfo.color }}>{hoveredInfo.factor_of_safety}</span></div>
            <div>11-Day API: <span className="font-semibold text-cyan-400">{hoveredInfo.api_11} mm</span></div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-40 left-4 z-[400] p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl text-xs flex flex-col gap-1.5">
        <div className="font-semibold text-slate-200 text-[10px] flex items-center justify-between">
          <span>Hazard Level (FS Threshold)</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
            <span className="text-slate-300">Normal (&gt;1.30)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#EAB308]" />
            <span className="text-slate-300">Advisory (1.15-1.3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F97316]" />
            <span className="text-slate-300">Warning (1.0-1.15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] animate-pulse" />
            <span className="text-slate-200 font-bold">Critical (&lt;1.0)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
