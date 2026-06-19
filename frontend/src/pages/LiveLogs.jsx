import React, { useEffect, useRef } from 'react';
import { Terminal, RefreshCcw, Activity, Radio } from 'lucide-react';

export default function LiveLogs({ logs, isRunning, fetchLogs }) {
  const endOfLogsRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogStyle = (log) => {
    if (!log) return {};
    if (log.includes('ERROR') || log.includes('Failed')) return { color: 'var(--danger)' };
    if (log.includes('SUCCESS') || log.includes('Applied')) return { color: 'var(--success)' };
    if (log.includes('Redirect')) return { color: 'var(--accent)' };
    if (log.includes('[SYSTEM]')) return { color: '#94A3B8', fontStyle: 'italic' };
    return { color: '#E2E8F0' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: '1100px', margin: '0 auto', padding: '2rem', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={28} color="var(--primary)" /> Live Agent
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Real-time stream from your AI job application agent.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.85rem', padding: '0.5rem 1.25rem', borderRadius: '999px',
            background: isRunning ? '#D1FAE5' : '#F1F5F9',
            color: isRunning ? '#065F46' : 'var(--text-muted)',
            border: `1px solid ${isRunning ? '#A7F3D0' : '#E2E8F0'}`,
            fontWeight: 600
          }}>
            {isRunning ? (
              <>
                <span style={{ 
                  display: 'inline-block', width: '8px', height: '8px', 
                  borderRadius: '50%', background: 'var(--success)',
                  boxShadow: '0 0 0 0 var(--success)',
                  animation: 'pulse-ring 1.2s infinite'
                }} />
                Active Sequence
              </>
            ) : (
              <>
                <Activity size={14} />
                Standby Mode
              </>
            )}
          </div>
          <button 
            onClick={fetchLogs} 
            className="btn btn-secondary"
            title="Force refresh logs"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      {/* Terminal Window */}
      <div style={{ flex: 1, overflow: 'hidden', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}>
        {/* Terminal Title Bar */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1.25rem', 
          background: '#1E293B',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontSize: '0.78rem', color: '#64748B', fontWeight: 500, fontFamily: 'monospace' }}>
            linker-ai — agent terminal
          </div>
        </div>

        {/* Log Content */}
        <div
          style={{ 
            height: 'calc(100% - 44px)',
            background: '#0F172A',
            padding: '1.5rem',
            color: '#E2E8F0',
            overflowY: 'auto',
            fontSize: '0.875rem',
            lineHeight: '1.7',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
          }}
        >
          {/* Static system banner */}
          <div style={{ marginBottom: '1rem', color: '#334155', borderBottom: '1px dashed #1E293B', paddingBottom: '1rem' }}>
            <div>[SYSTEM] LinkerAI Automated Framework v2.0 initialized.</div>
            <div>[SYSTEM] Backend services connected → OK</div>
            <div>[SYSTEM] Listening for agent execution streams...</div>
          </div>

          {logs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569' }}>
              <span style={{ 
                display: 'inline-block', width: '9px', height: '17px', 
                background: 'var(--success)',
                animation: 'blink-cursor 1.1s step-end infinite'
              }} />
              Awaiting instructions from Launchpad...
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} style={{ 
                display: 'flex', gap: '1rem', 
                marginBottom: '0.35rem',
                ...getLogStyle(log) 
              }}>
                <span style={{ opacity: 0.35, color: '#94A3B8', flexShrink: 0, fontSize: '0.78rem', paddingTop: '0.05rem' }}>
                  [{new Date().toLocaleTimeString()}]
                </span>
                <span style={{ wordBreak: 'break-word' }}>{log}</span>
              </div>
            ))
          )}

          {isRunning && logs.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'inline-block', width: '9px', height: '17px', background: 'var(--success)', animation: 'blink-cursor 1.1s step-end infinite' }} />
          )}
          <div ref={endOfLogsRef} />
        </div>
      </div>
    </div>
  );
}
