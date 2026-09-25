import React, { useState, useEffect } from 'react';
import { X, Truck, Wrench, Clock, Shield, MapPin, CheckCircle, Navigation, Send } from 'lucide-react';
import { fetchLogisticsDepots, fetchDispatchAdvisory } from '../services/api';

export default function LogisticsModal({ isOpen, onClose, defaultTargetKm = 52.5 }) {
  if (!isOpen) return null;

  const [depots, setDepots] = useState([]);
  const [targetKm, setTargetKm] = useState(defaultTargetKm);
  const [debrisVolume, setDebrisVolume] = useState(500);
  const [advisory, setAdvisory] = useState(null);
  const [dispatchStatus, setDispatchStatus] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetchLogisticsDepots().then(res => setDepots(res.depots || [])).catch(console.error);
    fetchDispatchAdvisory(targetKm, debrisVolume).then(setAdvisory).catch(console.error);
  }, []);

  const handleRecalculate = async (km, vol) => {
    setTargetKm(km);
    setDebrisVolume(vol);
    try {
      const res = await fetchDispatchAdvisory(km, vol);
      setAdvisory(res);
      setDispatchStatus(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatch = () => {
    setDispatchStatus({
      active: true,
      timestamp: new Date().toLocaleTimeString(),
      convoyId: `BRO-CONVOY-${Math.floor(1000 + Math.random() * 9000)}`
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Border Roads Organisation (BRO) Staging Bay Tracker</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  PROJECT SEWAK / VARTAK
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Heavy Excavator Depots & Rapid Clearance Response Routing along NH-106</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Logistics Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Staging Bays Grid */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Pre-Positioned Equipment Staging Depots
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {depots.map((depot) => (
                <div key={depot.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white truncate">{depot.name.split(' ')[0]} Base</span>
                      <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        km {depot.chainage_km}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold mb-2">⚡ Readiness: {depot.crew_readiness}</div>

                    <div className="space-y-1 text-[11px] text-slate-300">
                      {depot.equipment?.map((eq, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] bg-slate-900/60 px-2 py-1 rounded">
                          <span className="truncate">{eq.type}</span>
                          <span className="font-mono font-bold text-cyan-300">x{eq.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Officer: {depot.contact_officer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rapid Dispatch Calculator */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                Emergency Mobilization Route & Clearance Calculator
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Dynamic Dispatch Model</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Landslide Chainage: <b className="text-white">km {targetKm.toFixed(1)}</b></label>
                <input
                  type="range"
                  min="40.0"
                  max="70.0"
                  step="0.5"
                  value={targetKm}
                  onChange={(e) => handleRecalculate(parseFloat(e.target.value), debrisVolume)}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Estimated Debris Volume: <b className="text-cyan-400">{debrisVolume} m³</b></label>
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="50"
                  value={debrisVolume}
                  onChange={(e) => handleRecalculate(targetKm, parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>
            </div>

            {advisory && (
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-blue-300 font-bold">Optimal Mobilization Source:</span>
                  <span className="text-white font-semibold font-mono">{advisory.nearest_depot?.name}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Transit Distance</div>
                    <div className="text-white font-mono font-bold">{advisory.distance_to_site_km} km</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Transit ETA</div>
                    <div className="text-cyan-400 font-mono font-bold">{advisory.transit_eta_minutes} Mins</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Clearance Time</div>
                    <div className="text-amber-400 font-mono font-bold">{advisory.estimated_clearance_hours} Hours</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 font-mono pt-1">
                  💡 {advisory.recommended_action}
                </div>
              </div>
            )}

            {/* Dispatch Action */}
            <div className="pt-2 flex items-center justify-between">
              {dispatchStatus ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold font-mono">
                  <CheckCircle className="w-4 h-4" />
                  <span>CONVOY DISPATCHED ({dispatchStatus.convoyId} at {dispatchStatus.timestamp})</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">Ready for automated mobilization order dispatch.</div>
              )}

              <button
                onClick={handleDispatch}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-950/60 transition-transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit BRO Mobilization Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
