import React, { useState } from 'react';
import { CloudRain, Zap, RotateCcw, AlertTriangle, Play, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';
import { triggerStormSimulation, resetStormSimulation } from '../services/api';

const SCENARIOS = [
  {
    name: 'Normal Monsoon',
    rain: 15.0,
    days: 3,
    icon: '🌧️',
    desc: 'Typical steady monsoon drizzle. Stable regolith.'
  },
  {
    name: '5-Day Soaking',
    rain: 45.0,
    days: 6,
    icon: '⛈️',
    desc: 'Prolonged saturation. Elevated pore pressure.'
  },
  {
    name: 'Severe Cloudburst',
    rain: 110.0,
    days: 8,
    icon: '⚡',
    desc: 'Intense 110mm downpour. Localized slope failures.'
  },
  {
    name: '150mm Deluge Surge',
    rain: 150.0,
    days: 11,
    icon: '🚨',
    desc: 'Catastrophic cloudburst. Red Hazard along NH-106.'
  }
];

export default function StormSimulator({
  weatherState,
  onStormTriggered,
  onResetWeather,
  onOpenCapAlert
}) {
  const [rainIntensity, setRainIntensity] = useState(120.0);
  const [antecedentDays, setAntecedentDays] = useState(8);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState('Severe Cloudburst');

  const handleApplyPreset = (sc) => {
    setActivePreset(sc.name);
    setRainIntensity(sc.rain);
    setAntecedentDays(sc.days);
  };

  const handleTrigger = async () => {
    setLoading(true);
    try {
      const res = await triggerStormSimulation(rainIntensity, antecedentDays, activePreset || 'Custom Deluge');
      if (onStormTriggered) onStormTriggered(res);
      // If severe storm triggered, prompt CAP alert
      if (rainIntensity >= 60.0 && onOpenCapAlert) {
        setTimeout(() => onOpenCapAlert(), 600);
      }
    } catch (err) {
      console.error('Failed to trigger storm simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await resetStormSimulation();
      if (onResetWeather) onResetWeather(res);
    } catch (err) {
      console.error('Failed to reset weather:', err);
    } finally {
      setLoading(false);
    }
  };

  const isSim = weatherState?.is_simulation;

  return (
    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Title & Live Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Storm Deluge & Cloudburst Simulator</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 font-mono">DEMO CORE</span>
            </h3>
            <p className="text-[11px] text-slate-400">Stress-test 1,000 corridor chainages in real-time</p>
          </div>
        </div>

        {isSim ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-semibold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SIMULATION ENGAGED</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE OPEN-METEO TELEMETRY</span>
          </span>
        )}
      </div>

      {/* Preset Scenario Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {SCENARIOS.map((sc) => {
          const isSelected = activePreset === sc.name;
          return (
            <button
              key={sc.name}
              onClick={() => handleApplyPreset(sc)}
              className={`p-2.5 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{sc.icon}</span>
                <span className="text-[11px] font-mono font-bold text-cyan-400">{sc.rain} mm/h</span>
              </div>
              <div className="text-xs font-semibold text-white truncate">{sc.name}</div>
              <div className="text-[10px] text-slate-400 line-clamp-1">{sc.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Sliders Area */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3.5">
        {/* Rainfall Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Simulated Rainfall Intensity (P_t):</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">{rainIntensity} mm/hr</span>
          </div>
          <input
            type="range"
            min="0"
            max="160"
            step="5"
            value={rainIntensity}
            onChange={(e) => {
              setRainIntensity(parseFloat(e.target.value));
              setActivePreset('Custom Slider');
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>0 mm (Clear)</span>
            <span>50 mm (Heavy)</span>
            <span className="text-red-400 font-bold">150 mm (Extreme Cloudburst)</span>
          </div>
        </div>

        {/* Antecedent Days Slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Antecedent Monsoon Saturation Days:</span>
            <span className="font-mono font-bold text-blue-400 text-sm">{antecedentDays} Days</span>
          </div>
          <input
            type="range"
            min="1"
            max="14"
            step="1"
            value={antecedentDays}
            onChange={(e) => {
              setAntecedentDays(parseInt(e.target.value));
              setActivePreset('Custom Slider');
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>1 Day (Dry Soil)</span>
            <span>6 Days (Saturated)</span>
            <span>14 Days (Fully Liquidized Regolith)</span>
          </div>
        </div>
      </div>

      {/* Action Trigger Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleTrigger}
          disabled={loading}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Zap className="w-4 h-4 fill-white" />
          )}
          <span>TRIGGER CLOUDBURST SURGE ({rainIntensity} mm/hr)</span>
        </button>

        {isSim && (
          <button
            onClick={handleReset}
            disabled={loading}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 shadow-md"
            title="Reset to real-time Open-Meteo telemetry"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
