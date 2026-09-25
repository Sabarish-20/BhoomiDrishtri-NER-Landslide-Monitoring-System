import React from 'react';
import { X, ShieldAlert, Activity, Droplets, Mountain, Compass, Wrench, Clock, CheckCircle, AlertOctagon, TrendingUp, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function GeotechnicalInspector({ segment, onClose, onOpenLogistics }) {
  if (!segment) return null;

  const fs = parseFloat(segment.factor_of_safety || 1.35);
  const slope = parseFloat(segment.slope_deg || 30.0);
  const api11 = parseFloat(segment.api_11 || 45.0);
  const twi = parseFloat(segment.twi || 6.5);
  const riskLevel = parseInt(segment.risk_level || 0);

  // Compute pore pressure
  const porePressure = Math.max(0, (api11 / 80.0) * 8.5 + (twi / 10.0) * 4.0 - 2.0).toFixed(2);

  // Gauge percentage: FS 0.0 to 2.5 mapped to 0-100%
  const gaugePercent = Math.min(100, Math.max(0, (fs / 2.0) * 100));

  // Synthesize 11-day rainfall decay bars for chart
  const decayWeights = Array.from({ length: 11 }, (_, idx) => Math.pow(0.84, idx + 1));
  const baseRain = api11 / 3.5;
  const chartData = decayWeights.map((w, idx) => ({
    day: `T-${11 - idx}`,
    rainfall: parseFloat((baseRain * (0.6 + Math.sin(idx) * 0.4)).toFixed(1)),
    weighted: parseFloat((baseRain * (0.6 + Math.sin(idx) * 0.4) * w).toFixed(1))
  })).concat([{ day: 'Today (Pt)', rainfall: parseFloat((segment.daily_rainfall_mm || 15).toFixed(1)), weighted: parseFloat((segment.daily_rainfall_mm || 15).toFixed(1)) }]);

  // Risk Color & Status
  let statusBadge = { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'Stable Regolith' };
  if (riskLevel === 3) {
    statusBadge = { bg: 'bg-red-500/25', text: 'text-red-400', border: 'border-red-500/50', label: 'CRITICAL SLOPE FAILURE HAZARD' };
  } else if (riskLevel === 2) {
    statusBadge = { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', label: 'HIGH VULNERABILITY WARNING' };
  } else if (riskLevel === 1) {
    statusBadge = { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', label: 'GEOTECHNICAL ADVISORY' };
  }

  return (
    <div className="w-96 flex-shrink-0 bg-slate-900/95 border-l border-slate-800 backdrop-blur-xl h-full flex flex-col shadow-2xl z-30 overflow-hidden select-none animate-slide-left">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 tracking-wider font-semibold">{segment.id || 'NH-106'}</span>
            <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">30m Cell</span>
          </div>
          <h2 className="text-sm font-bold text-white mt-0.5">{segment.landmark || 'NH-106 Hillside Section'}</h2>
          <div className="text-[11px] text-slate-400 font-mono">{segment.chainage_label} (Elev: {segment.elevation_m}m)</div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Risk Status Banner */}
        <div className={`p-3 rounded-xl border ${statusBadge.bg} ${statusBadge.border} flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            {riskLevel >= 2 ? (
              <ShieldAlert className={`w-5 h-5 ${statusBadge.text} animate-bounce`} />
            ) : (
              <CheckCircle className={`w-5 h-5 ${statusBadge.text}`} />
            )}
            <div>
              <div className={`text-xs font-bold ${statusBadge.text}`}>{statusBadge.label}</div>
              <div className="text-[10px] text-slate-300">Physics-Guided ML Grade {riskLevel}</div>
            </div>
          </div>
        </div>

        {/* 1D Deterministic Infinite Slope Factor of Safety Gauge */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Factor of Safety (FS)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Infinite Slope Model</span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold tracking-tight" style={{ color: segment.color || '#10B981' }}>
              {fs.toFixed(3)}
            </span>
            <span className="text-xs text-slate-400">
              {fs < 1.0 ? '🚨 Below Limit Equilibrium (Failing)' : fs < 1.25 ? '⚠️ Marginal Shear Margin' : '✅ Stable Factor'}
            </span>
          </div>

          {/* Progress Bar Gauge */}
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative p-0.5">
            {/* Limit line at FS = 1.0 (50% mark) */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-500 z-10 shadow-glow" title="Failure Limit (FS = 1.0)" />
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${gaugePercent}%`,
                backgroundColor: segment.color || '#10B981'
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>0.0 (Failure)</span>
            <span className="text-red-400 font-bold">1.0 (Limit)</span>
            <span>2.0+ (Safe)</span>
          </div>
        </div>

        {/* Physics-Guided Machine Learning (PGML) Guard Banner */}
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs">
          <div className="flex items-center justify-between text-cyan-300 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              PGML Constraint Guard
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-mono">XGBoost-V2</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {fs > 1.25
              ? '🛡️ Hard Physics Boundary Enforced: Mechanically sound slope (FS > 1.25). Red/Orange false alarms strictly suppressed.'
              : fs < 0.95
              ? '⚠️ Mechanical Failure Override: Infinite slope equilibrium breached. Immediate warning elevated.'
              : '⚡ Active dynamic equilibrium under real-time pore water pressure.'}
          </p>
        </div>

        {/* 11-Day Antecedent Saturation (API_11) Dynamics Curve */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              11-Day Antecedent Precipitation (API₁₁)
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">{api11.toFixed(1)} mm</span>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">Formula: API = P_t + Σ (0.84)^i · P_t-i (i = 1 to 11)</p>

          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#64748b' }} interval={2} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="weighted" name="Weighted (mm)" fill="#38bdf8" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#ef4444' : '#0284c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geomechanical Physics Parameters Grid */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
            <Mountain className="w-3.5 h-3.5 text-emerald-400" />
            Geomechanical & DEM Parameters
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Slope Angle (β)</div>
              <div className="text-white font-bold font-mono text-xs mt-0.5">{slope}°</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Aspect Orientation</div>
              <div className="text-white font-bold font-mono text-xs mt-0.5">{segment.aspect_deg || 180}° (Facing)</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Topographic Wetness (TWI)</div>
              <div className="text-cyan-400 font-bold font-mono text-xs mt-0.5">{twi}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Pore Pressure (u)</div>
              <div className="text-amber-400 font-bold font-mono text-xs mt-0.5">{porePressure} kPa</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Soil Cohesion (c')</div>
              <div className="text-white font-mono text-xs mt-0.5">12.0 kPa</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Friction Angle (φ')</div>
              <div className="text-white font-mono text-xs mt-0.5">28.0°</div>
            </div>
          </div>
        </div>

        {/* BRO Route Clearance Advisory */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-yellow-400" />
              BRO Logistics & Clearance Advisory
            </span>
          </div>
          <div className="text-[11px] text-slate-300 mb-3 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono">
            {segment.clearance_advisory || 'Passable. No active debris blockage expected.'}
          </div>

          <button
            onClick={() => onOpenLogistics(segment.chainage_start_km)}
            className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cyan-900/30"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Open BRO Staging Dispatch Bay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
