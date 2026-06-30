import React from 'react';
import { 
  Globe, MapPin, Play, Loader2, Sparkles, BrainCircuit, Target, 
  Check, Upload, Trash2, Activity, CheckCircle2, ChevronRight, FileText, Terminal
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');

const LOCATIONS = [
  { id: 'Chennai', label: 'Chennai' },
  { id: 'Bengaluru', label: 'Bengaluru' },
  { id: 'Hyderabad', label: 'Hyderabad' },
  { id: 'Pune', label: 'Pune' },
  { id: 'Remote', label: 'Remote' },
];

const MOCK_AI_ANALYSIS = {
  atsScore: 87,
  jobMatch: 91,
  topSkills: ['React', 'Node.js', 'AWS', 'TypeScript'],
  missingSkills: ['Kubernetes', 'Terraform'],
  recommendedRoles: ['Senior Frontend Engineer', 'Full Stack Engineer', 'AI Product Engineer']
};

export default function Launchpad({
  availablePortals, selectedPortals, setSelectedPortals,
  targetTitles, setJobTitles,
  experience, setExperience,
  recency, setRecency,
  resumes, setResumes,
  selectedResume, setSelectedResume,
  atsThreshold, setAtsThreshold,
  autoApply, setAutoApply,
  selectedLocations, setSelectedLocations,
  handleStartAgent, isRunning, logs,
  analysisData, isAnalyzing,
  maxJobs, setMaxJobs
}) {

  const handlePortalToggle = (portalId) => {
    setSelectedPortals(prev =>
      prev.includes(portalId)
        ? prev.filter(id => id !== portalId)
        : [...prev, portalId]
    );
  };

  const handleLocationToggle = (locId) => {
    setSelectedLocations(prev => 
      prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${API_BASE_URL}/resumes`, formData);
      setResumes(prev => [...prev, res.data.filename]);
      setSelectedResume(res.data.filename);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload resume.");
    }
  };

  const handleDeleteResume = async (filename, e) => {
    e.preventDefault();
    try {
      await axios.delete(`${API_BASE_URL}/resumes/${filename}`);
      setResumes(prev => prev.filter(r => r !== filename));
      if (selectedResume === filename) setSelectedResume('');
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="dashboard-grid fade-up">
      
      {/* Left Panel: Configuration */}
      <div className="left-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
          <Target size={18} color="var(--primary)" /> Job Targeting
        </h2>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Resume Upload */}
          <div>
            <label className="form-label">Knowledge Base (Resume)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <select className="form-input" value={selectedResume} onChange={e => setSelectedResume(e.target.value)}>
                <option value="" disabled>Select Resume</option>
                {resumes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {selectedResume && (
                <button className="btn btn-danger" style={{ padding: '0 0.75rem' }} onClick={(e) => handleDeleteResume(selectedResume, e)}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <label htmlFor="resume-upload" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', padding: '0.7rem', background: 'var(--bg-app)', border: '1px dashed var(--border)', 
              borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer',
              fontWeight: 600, transition: 'all 0.2s'
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--text-main)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <Upload size={14} /> Upload New PDF
            </label>
            <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} id="resume-upload" />
          </div>

          {/* Job Titles */}
          <div>
            <label className="form-label">Target Roles</label>
            <input type="text" className="form-input" value={targetTitles} onChange={e => setJobTitles(e.target.value)} placeholder="e.g., Software Engineer, Frontend Developer" />
          </div>

          {/* Locations */}
          <div>
            <label className="form-label">Locations</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {LOCATIONS.map(loc => {
                const isSel = selectedLocations.includes(loc.id);
                return (
                  <label key={loc.id} style={{
                    cursor: 'pointer', padding: '0.35rem 0.75rem', borderRadius: '99px',
                    border: `1px solid ${isSel ? 'var(--primary)' : 'var(--border)'}`,
                    background: isSel ? 'var(--primary-glow)' : 'var(--bg-card)',
                    color: isSel ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s',
                    display: 'inline-flex', alignItems: 'center'
                  }}
                    onMouseOver={e => { if(!isSel) e.currentTarget.style.borderColor = 'var(--text-muted)' }}
                    onMouseOut={e => { if(!isSel) e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    <input type="checkbox" checked={isSel} onChange={() => handleLocationToggle(loc.id)} style={{ display: 'none' }} />
                    {loc.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Experience (YOE) and Date Posted (Recency) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Experience</label>
              <select 
                className="form-input" 
                value={experience} 
                onChange={e => setExperience(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              >
                <option value="Any">Any</option>
                <option value="0-1 years">0-1 years</option>
                <option value="1-3 years">1-3 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="5+ years">5+ years</option>
              </select>
            </div>
            <div>
              <label className="form-label">Date Posted</label>
              <select 
                className="form-input" 
                value={recency} 
                onChange={e => setRecency(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              >
                <option value="Any">Any (All time)</option>
                <option value="Past 24 hours">Past 24 hours</option>
                <option value="Past week">Past week</option>
                <option value="Past month">Past month</option>
              </select>
            </div>
          </div>

          {/* Max Jobs to Apply */}
          <div>
            <label className="form-label">Max Jobs to Apply</label>
            <select 
              className="form-input" 
              value={maxJobs} 
              onChange={e => setMaxJobs(parseInt(e.target.value))}
              style={{ fontSize: '0.82rem' }}
            >
              <option value={10}>Apply 10 jobs</option>
              <option value={20}>Apply 20 jobs</option>
              <option value={30}>Apply 30 jobs</option>
              <option value={40}>Apply 40 jobs</option>
              <option value={50}>Apply 50 jobs (Max)</option>
            </select>
          </div>

          {/* Portals */}
          <div>
            <label className="form-label">Job Portals</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {availablePortals.map(portal => {
                const isSel = selectedPortals.includes(portal.id);
                return (
                  <label key={portal.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                    padding: '0.55rem 0.75rem', borderRadius: '10px', 
                    border: `1px solid ${isSel ? portal.color : 'var(--border)'}`,
                    background: isSel ? `${portal.color}10` : 'var(--bg-card)',
                    transition: 'all 0.2s'
                  }}
                    onMouseOver={e => { if(!isSel) e.currentTarget.style.borderColor = 'var(--text-muted)' }}
                    onMouseOut={e => { if(!isSel) e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    <input type="checkbox" checked={isSel} onChange={() => handlePortalToggle(portal.id)} style={{ display: 'none' }} />
                    <div style={{ 
                      width: '16px', height: '16px', borderRadius: '4px', 
                      border: `2px solid ${isSel ? portal.color : 'var(--text-muted)'}`, 
                      background: isSel ? portal.color : 'transparent', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s'
                    }}>
                      {isSel && <Check size={10} color="white" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{portal.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel: AI Analysis & Launch */}
      <div className="center-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {selectedResume ? (
          isAnalyzing ? (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center' }}>
              <Loader2 className="lucide-spin text-gradient" size={44} style={{ marginBottom: '1.25rem' }} />
              <h2 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', fontWeight: 700 }}>Analyzing Resume...</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '340px' }}>Extracting key skills and tailored role recommendations using AI.</p>
            </div>
          ) : analysisData ? (
            <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', padding: '1rem', opacity: 0.05, color: 'var(--primary)' }}>
                <BrainCircuit size={130} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <Sparkles size={20} color="var(--accent)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>AI Career Analysis</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Experience (Estimated)</span>
                  <span className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.25rem' }}>{analysisData.experience_years} Yrs</span>
                </div>
                <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Skills Detected</span>
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>{analysisData.skills ? analysisData.skills.length : 0}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Top Skills Detected</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {analysisData.skills && analysisData.skills.map(skill => <span key={skill} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{skill}</span>)}
                </div>
              </div>

              <div style={{ background: 'var(--primary-glow)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-highlight)' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Recommended Roles (Click to Target)</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {analysisData.target_job_titles && analysisData.target_job_titles.map((role, i) => (
                    <span 
                      key={i} 
                      onClick={() => {
                        setJobTitles(prev => {
                          const roles = prev.split(',').map(r => r.trim()).filter(Boolean);
                          if (!roles.includes(role)) {
                            return [...roles, role].join(', ');
                          }
                          return prev;
                        });
                      }}
                      style={{ 
                        fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', 
                        cursor: 'pointer', background: 'var(--bg-card)', padding: '0.3rem 0.65rem', borderRadius: '8px', 
                        border: '1px solid var(--border)', color: 'var(--text-main)', transition: 'all 0.15s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
                    >
                      <CheckCircle2 size={12} color="var(--accent)" /> {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center' }}>
              <FileText size={40} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h2 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', fontWeight: 700 }}>Awaiting Analysis</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading analysis data for {selectedResume}...</p>
            </div>
          )
        ) : (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center' }}>
            <FileText size={40} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', fontWeight: 700 }}>Awaiting Knowledge Base</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '340px' }}>Upload a resume in the left panel to unlock the AI Career Analysis and personalized recommendations.</p>
          </div>
        )}

        {/* AI Launch Controls */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <Sparkles size={14} color="var(--accent)" /> Auto-Apply Mode
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>AI will draft & submit applications autonomously</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={autoApply} onChange={e => setAutoApply(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleStartAgent}
            disabled={isRunning || selectedPortals.length === 0 || !targetTitles || !selectedResume}
            style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
          >
            {isRunning ? (
              <><Loader2 className="lucide-spin" size={18} /> Initializing Agent...</>
            ) : (
              <><Play size={18} fill="currentColor" /> Launch AI Job Agent</>
            )}
          </button>
        </div>

      </div>

      {/* Right Panel: Live Activity Feed */}
      <div className="right-panel">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
          <Activity size={18} color={isRunning ? "var(--accent)" : "var(--text-muted)"} /> 
          Live Activity
        </h2>
        
        <div className="card" style={{ 
          height: 'calc(100vh - 160px)', 
          overflowY: 'auto', 
          background: '#090D16', 
          padding: '1rem',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
        }}>
          {logs && logs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontFamily: 'monospace' }}>
              {logs.slice().reverse().map((log, i) => {
                let color = '#94A3B8';
                if (log.includes('ERROR') || log.includes('Failed')) color = '#EF4444';
                else if (log.includes('SUCCESS') || log.includes('Applied')) color = '#10B981';
                else if (log.includes('Redirect')) color = '#818CF8';
                else if (log.includes('Scanned') || log.includes('Evaluating')) color = '#3B82F6';

                return (
                  <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', fontSize: '0.78rem', color: color }}>
                    <ChevronRight size={12} style={{ marginTop: '0.15rem', flexShrink: 0, opacity: 0.5 }} />
                    <span style={{ lineHeight: 1.4, wordBreak: 'break-all' }}>{log}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', textAlign: 'center' }}>
              <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Terminal size={20} />
              </div>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>Agent is resting.<br/>Launch to see activity feed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
