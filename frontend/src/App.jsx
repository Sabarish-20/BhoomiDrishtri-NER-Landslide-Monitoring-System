import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CorridorMap from './components/CorridorMap';
import GeotechnicalInspector from './components/GeotechnicalInspector';
import StormSimulator from './components/StormSimulator';
import CAPAlertModal from './components/CAPAlertModal';
import LogisticsModal from './components/LogisticsModal';
import CrowdsourceModal from './components/CrowdsourceModal';

import {
  fetchCorridorGrid,
  fetchCurrentWeather,
  fetchActiveAlerts,
  fetchLatestCapXml,
  fetchCrowdsourceClusters
} from './services/api';

import { ShieldAlert, AlertTriangle, Radio, ChevronRight, X } from 'lucide-react';

export default function App() {
  const [corridorData, setCorridorData] = useState(null);
  const [weatherState, setWeatherState] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [latestXml, setLatestXml] = useState('');
  const [crowdsourceData, setCrowdsourceData] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);

  // Modals state
  const [capModalOpen, setCapModalOpen] = useState(false);
  const [logisticsModalOpen, setLogisticsModalOpen] = useState(false);
  const [crowdsourceModalOpen, setCrowdsourceModalOpen] = useState(false);
  const [targetLogisticsKm, setTargetLogisticsKm] = useState(53.2);

  // Storm panel toggle
  const [stormPanelOpen, setStormPanelOpen] = useState(true);

  // Initial load
  const loadDashboardData = async () => {
    try {
      const [grid, weather, alerts, xml, crowdsource] = await Promise.all([
        fetchCorridorGrid(),
        fetchCurrentWeather(),
        fetchActiveAlerts(),
        fetchLatestCapXml(),
        fetchCrowdsourceClusters()
      ]);

      setCorridorData(grid);
      setWeatherState(weather);
      setAlertsData(alerts);
      setLatestXml(xml);
      setCrowdsourceData(crowdsource);

      // Default selected segment (e.g., critical or steep section km 52.5)
      if (grid?.features && grid.features.length > 400 && !selectedSegment) {
        setSelectedSegment(grid.features[415].properties);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Auto-poll weather & grid every 30s
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStormTriggered = (res) => {
    loadDashboardData();
  };

  const handleResetWeather = (res) => {
    loadDashboardData();
  };

  const handleOpenLogistics = (km) => {
    setTargetLogisticsKm(km || 53.2);
    setLogisticsModalOpen(true);
  };

  const criticalCount = corridorData?.summary?.critical_red_cells || 0;
  const activeAlert = alertsData?.active_alerts?.[0];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <Header
        summary={corridorData?.summary}
        weather={weatherState}
        onOpenCapModal={() => setCapModalOpen(true)}
        onOpenLogistics={() => handleOpenLogistics(selectedSegment?.chainage_start_km)}
        onOpenCrowdsource={() => setCrowdsourceModalOpen(true)}
        hasActiveAlerts={criticalCount > 0}
      />

      {/* Live Warning Ticker if Critical Red Alert is active */}
      {criticalCount > 0 && activeAlert && (
        <div className="bg-red-600/90 text-white px-4 py-1.5 flex items-center justify-between text-xs font-semibold backdrop-blur-md shadow-lg border-b border-red-500 animate-pulse z-20">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-ping" />
            <span>NDMA CAP 1.2 ALERT BROADCAST:</span>
            <span className="font-mono font-bold underline">{activeAlert.headline}</span>
          </div>
          <button
            onClick={() => setCapModalOpen(true)}
            className="flex items-center gap-1 bg-white text-red-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold hover:bg-slate-100 transition-colors"
          >
            <span>View OASIS XML</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Central 3D/2D GIS Map */}
        <div className="flex-1 h-full relative">
          <CorridorMap
            corridorData={corridorData}
            selectedSegment={selectedSegment}
            onSelectSegment={(seg) => setSelectedSegment(seg)}
            crowdsourceData={crowdsourceData}
            onOpenCrowdsource={() => setCrowdsourceModalOpen(true)}
            onOpenCapModal={() => setCapModalOpen(true)}
          />

          {/* Floating Storm Simulator Panel Toggle */}
          <div className="absolute top-4 right-4 z-20 max-w-lg w-full">
            {stormPanelOpen ? (
              <div className="relative">
                <button
                  onClick={() => setStormPanelOpen(false)}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shadow-md hover:text-white z-30"
                  title="Collapse Simulator"
                >
                  <X className="w-4 h-4" />
                </button>
                <StormSimulator
                  weatherState={weatherState}
                  onStormTriggered={handleStormTriggered}
                  onResetWeather={handleResetWeather}
                  onOpenCapAlert={() => setCapModalOpen(true)}
                />
              </div>
            ) : (
              <button
                onClick={() => setStormPanelOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/50 text-cyan-400 font-bold text-xs flex items-center gap-2 backdrop-blur-md shadow-xl transition-all"
              >
                <span>⚡ Open Storm Deluge Simulator</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Slide-Over Geotechnical Inspector Drawer */}
        {selectedSegment && (
          <GeotechnicalInspector
            segment={selectedSegment}
            onClose={() => setSelectedSegment(null)}
            onOpenLogistics={(km) => handleOpenLogistics(km)}
          />
        )}
      </div>

      {/* Modals */}
      <CAPAlertModal
        isOpen={capModalOpen}
        onClose={() => setCapModalOpen(false)}
        alertsData={alertsData}
        latestXml={latestXml}
      />

      <LogisticsModal
        isOpen={logisticsModalOpen}
        onClose={() => setLogisticsModalOpen(false)}
        defaultTargetKm={targetLogisticsKm}
      />

      <CrowdsourceModal
        isOpen={crowdsourceModalOpen}
        onClose={() => setCrowdsourceModalOpen(false)}
        crowdsourceData={crowdsourceData}
        onReportSubmitted={() => loadDashboardData()}
      />
    </div>
  );
}
