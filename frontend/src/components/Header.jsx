import React from 'react';
import { Mountain, ShieldAlert, Radio, Truck, Smartphone, CloudRain, Droplets, Activity, Layers } from 'lucide-react';

export default function Header({
  summary,
  weather,
  onOpenCapModal,
  onOpenLogistics,
  onOpenCrowdsource,
  hasActiveAlerts
}) {
  const isSim = weather?.is_simulation;
  const criticalCount = summary?.critical_red_cells || 0;
  const warningCount = summary?.warning_orange_cells || 0;

  let hazardBadge = {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'ALL SECTORS NORMAL'
  };

  if (criticalCount > 0) {
    hazardBadge = {
      bg: 'bg-red-500/25',
      border: 'border-red-500/60',
      text: 'text-red-400',
      dot: 'bg-red-500 animate-ping',
      label: `CRITICAL RED ALERT (${criticalCount} SECTORS)`
    };
  } else if (warningCount > 0) {
    hazardBadge = {
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      dot: 'bg-orange-400',
      label: `WARNING ACTIVE (${warningCount} SECTORS)`
    };
  }

  return (
    <header className="h-16 px-4 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl flex items-center justify-between z-20 select-none shadow-lg">
      {/* Brand & Mission Identifier */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/60 border border-cyan-400/30">
          <Mountain className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
              <span>BhoomiDrishti-NER</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-mono border border-cyan-700/50">
                SIH26001
              </span>
            </h1>
            <span className="text-[11px] text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-300">NH-106 Guwahati-Shillong Corridor</span>
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-2">
            <span>Ri-Bhoi (km 40.0 - km 70.0)</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono">Physics-Guided ML (PGML)</span>
          </p>
        </div>
      </div>

      {/* Real-Time Telemetry Counters */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Overall Status Badge */}
        <div className={`px-3 py-1.5 rounded-xl border ${hazardBadge.bg} ${hazardBadge.border} flex items-center gap-2`}>
          <span className={`w-2 h-2 rounded-full ${hazardBadge.dot}`} />
          <span className={`text-xs font-bold font-mono ${hazardBadge.text}`}>{hazardBadge.label}</span>
        </div>

        {/* Rain Telemetry */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-xs">
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-400">Rainfall (Pt)</div>
            <div className="font-mono font-bold text-white">{weather?.current_rainfall_mm_hr || 0} mm/h</div>
          </div>
        </div>

        {/* API-11 Antecedent Saturation */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-xs">
          <Droplets className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-[10px] text-slate-400">Antecedent (API₁₁)</div>
            <div className="font-mono font-bold text-cyan-300">{weather?.api_11_mm || 0} mm</div>
          </div>
        </div>

        {/* Soil Moisture */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-xs">
          <Activity className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400">Soil Moisture</div>
            <div className="font-mono font-bold text-white">{((weather?.soil_moisture_vol || 0.45) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Navigation & Action Triggers */}
      <div className="flex items-center gap-2">
        {/* NDMA CAP 1.2 Alert Button */}
        <button
          onClick={onOpenCapModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            criticalCount > 0
              ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-lg shadow-red-950/80 animate-pulse'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
          }`}
          title="Open NDMA SACHET CAP 1.2 Alert Inspector"
        >
          <Radio className="w-4 h-4 text-red-400" />
          <span className="hidden sm:inline">NDMA CAP 1.2</span>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-red-600 text-[10px] font-extrabold font-mono">
              {criticalCount}
            </span>
          )}
        </button>

        {/* BRO Logistics Staging */}
        <button
          onClick={onOpenLogistics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          title="Open BRO Equipment Staging Depots"
        >
          <Truck className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline">BRO Staging</span>
        </button>

        {/* Crowdsource PWA */}
        <button
          onClick={onOpenCrowdsource}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          title="Citizen Incident & Crack Crowdsource"
        >
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Field PWA</span>
        </button>
      </div>
    </header>
  );
}
