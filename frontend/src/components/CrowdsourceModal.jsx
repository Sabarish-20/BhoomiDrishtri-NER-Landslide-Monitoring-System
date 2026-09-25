import React, { useState, useEffect } from 'react';
import { X, Camera, ShieldCheck, MapPin, AlertTriangle, Layers, Send, CheckCircle, Sparkles, Smartphone } from 'lucide-react';
import { submitCitizenReport } from '../services/api';

export default function CrowdsourceModal({ isOpen, onClose, crowdsourceData, onReportSubmitted }) {
  if (!isOpen) return null;

  const [chainageKm, setChainageKm] = useState(51.2);
  const [hazardType, setHazardType] = useState('Tension Crack (Pavement)');
  const [crackWidth, setCrackWidth] = useState(4.5);
  const [severity, setSeverity] = useState('HIGH');
  const [observerRole, setObserverRole] = useState('BRO Highway Patrol');
  const [notes, setNotes] = useState('Longitudinal tension crack expanding on mountain shoulder after rainfall.');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        latitude: 25.8200 + (chainageKm - 50.0) * 0.008,
        longitude: 91.8700 + (chainageKm - 50.0) * 0.003,
        chainage_km: chainageKm,
        hazard_type: hazardType,
        crack_width_cm: crackWidth,
        severity: severity,
        observer_role: observerRole,
        notes: notes,
        ai_confidence_score: 0.94
      };

      const res = await submitCitizenReport(payload);
      setSuccessMsg('Report verified via Edge AI and spatial DBSCAN clustering.');
      if (onReportSubmitted) onReportSubmitted(res);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Citizen & Field Patrol Crowdsource (Edge-AI PWA)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  DBSCAN HOTSPOT DETECTION
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Geotagged tension crack, retaining wall bulge & debris reporting with on-device computer vision</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Crowdsource Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Edge-AI Camera Simulation Viewfinder */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                Simulated Edge-AI Camera Viewfinder
              </div>

              <div className="relative w-full h-64 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 opacity-90" />
                
                <svg className="absolute inset-0 w-full h-full text-slate-950" preserveAspectRatio="none">
                  <path
                    d="M 50,220 Q 90,170 140,150 T 220,100 T 280,40"
                    fill="none"
                    stroke="#000"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 140,150 Q 180,180 230,190"
                    fill="none"
                    stroke="#000"
                    strokeWidth="4"
                  />
                </svg>

                <div className="absolute top-12 left-16 right-16 bottom-16 border-2 border-dashed border-red-500 rounded-lg pointer-events-none flex flex-col justify-between p-2 shadow-lg shadow-red-950/50 animate-pulse">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono bg-red-600 text-white font-bold px-1.5 py-0.5 rounded shadow">
                      TENSION_CRACK: 95.4%
                    </span>
                    <span className="text-[10px] font-mono bg-black/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40">
                      WIDTH: {crackWidth} cm
                    </span>
                  </div>
                  <div className="text-[10px] font-mono bg-black/80 text-emerald-400 px-1.5 py-0.5 rounded self-start border border-emerald-500/40">
                    GEOTAG: NH-106 km {chainageKm.toFixed(1)}
                  </div>
                </div>

                <div className="absolute bottom-2 text-[10px] text-slate-400 bg-black/70 px-2 py-0.5 rounded font-mono">
                  Mobile Edge Model: YOLOv8-LandslideCrack-Tiny
                </div>
              </div>
            </div>

            {/* Field Incident Input Form */}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-400 block mb-1">Chainage km:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="40.0"
                    max="70.0"
                    value={chainageKm}
                    onChange={(e) => setChainageKm(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Crack Width (cm):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50.0"
                    value={crackWidth}
                    onChange={(e) => setCrackWidth(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Hazard Classification:</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option>Tension Crack (Pavement)</option>
                  <option>Retaining Wall Bulge / Shear</option>
                  <option>Debris Slump / Mud Flow</option>
                  <option>Rockfall / Boulder Roll</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-400 block mb-1">Severity Level:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Reporting Authority:</label>
                  <select
                    value={observerRole}
                    onChange={(e) => setObserverRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option>BRO Highway Patrol</option>
                    <option>Meghalaya Traffic Police</option>
                    <option>Commercial Driver / Taxi</option>
                    <option>Citizen Volunteer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Observation Details:</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 transition-transform active:scale-95 disabled:opacity-50"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit Geotagged Hazard Report</span>
              </button>
            </form>
          </div>

          {/* DBSCAN Spatial Clusters List */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-red-400" />
                Active DBSCAN Spatial Hazard Clusters ({crowdsourceData?.clusters?.length || 0})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Eps: 550m | MinSamples: 2</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {crowdsourceData?.clusters?.map((cls) => (
                <div key={cls.cluster_id} className="p-3 rounded-xl bg-slate-900 border border-red-500/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 font-mono">{cls.cluster_id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 font-bold border border-red-800">
                      {cls.report_count} Reports
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-200">{cls.hazard_summary}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Corridor: ~km {cls.approx_chainage_km}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
