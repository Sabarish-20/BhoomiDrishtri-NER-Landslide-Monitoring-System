import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Copy, Check, Download, Radio, FileCode, ExternalLink, CheckCircle } from 'lucide-react';

export default function CAPAlertModal({ isOpen, onClose, alertsData, latestXml }) {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const activeAlert = alertsData?.active_alerts?.[0];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyXml = () => {
    if (!latestXml) return;
    navigator.clipboard.writeText(latestXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadXml = () => {
    if (!latestXml) return;
    const blob = new Blob([latestXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDMA_CAP1.2_ALERT_${new Date().toISOString().replace(/[:.]/g, '-')}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">NDMA SACHET / OASIS CAP 1.2 Alert Gateway</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  OASIS-CAP-1.2-VALIDATED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Standardized Common Alerting Protocol Broadcast Feed for Disaster Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close CAP Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Active Alert Card */}
          {activeAlert ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-950/40 to-slate-950 border border-red-500/40 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">{activeAlert.identifier}</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{activeAlert.headline}</h4>
                </div>
                <div className="flex gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold font-mono">
                    {activeAlert.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-bold font-mono">
                    {activeAlert.urgency}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-slate-800 font-mono">
                {activeAlert.description || activeAlert.headline}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Affected Corridor</div>
                  <div className="text-white font-mono font-bold">{activeAlert.affected_range}</div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Min Factor of Safety</div>
                  <div className="text-red-400 font-mono font-bold">{activeAlert.min_factor_of_safety?.toFixed(3)}</div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Max API-11 Saturation</div>
                  <div className="text-cyan-400 font-mono font-bold">{activeAlert.max_api_11?.toFixed(1)} mm</div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Critical 30m Cells</div>
                  <div className="text-amber-400 font-mono font-bold">{activeAlert.affected_cells_count} Cells</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Baseline Geotechnical Watch Active</div>
                <div className="text-[11px] text-slate-400">All NH-106 chainage sectors operating under normal Factor of Safety (FS &gt; 1.30).</div>
              </div>
            </div>
          )}

          {/* Raw XML Feed Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Raw OASIS CAP 1.2 XML Serialization
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyXml}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied XML' : 'Copy XML'}</span>
                </button>
                <button
                  onClick={handleDownloadXml}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .xml</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-72 leading-relaxed selection:bg-cyan-900 selection:text-white">
              {latestXml || '<!-- Loading OASIS CAP 1.2 XML Stream -->'}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>NDMA SACHET Gateway API Endpoint: <code className="text-cyan-400 font-mono">GET /api/alerts/latest.xml</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
