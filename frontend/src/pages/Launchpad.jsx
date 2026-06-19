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
    <div className="dashboard-grid">
      
      {/* Left Panel: Configuration */}
      <div className="left-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Target size={20} className="text-muted" /> Job Targeting
        </h2>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Resume Upload */}
          <div>
            <label className="form-label">Knowledge Base (Resume)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select className="form-input" value={selectedResume} onChange={e => setSelectedResume(e.target.value)}>
                <option value="" disabled>Select Resume</option>
                {resumes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {selectedResume && (
                <button className="btn btn-danger" style={{ padding: '0 0.75rem' }} onClick={(e) => handleDeleteResume(selectedResume, e)}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <label htmlFor="resume-upload" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', padding: '0.75rem', background: '#F1F5F9', border: '1px dashed #CBD5E1', 
              borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer'
            }}>
              <Upload size={14} /> Upload New PDF
            </label>
            <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} id="resume-upload" />
          </div>

          {/* Job Titles */}
          <div>
            <label className="form-label">Target Roles</label>
            <input type="text" className="form-input" value={targetTitles} onChange={e => setJobTitles(e.target.value)} placeholder="e.g., Software Engineer" />
          </div>

          {/* Locations */}
          <div>
            <label className="form-label">Locations</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {LOCATIONS.map(loc => {
                const isSel = selectedLocations.includes(loc.id);
                return (
                  <label key={loc.id} style={{
                    cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: '99px',
                    border: `1px solid ${isSel ? 'var(--primary)' : '#E2E8F0'}`,
                    background: isSel ? 'var(--primary-glow)' : 'white',
                    color: isSel ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s'
                  }}>
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
                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
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
                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
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
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
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
                    padding: '0.6rem 0.8rem', borderRadius: '8px', border: `1px solid ${isSel ? portal.color : '#E2E8F0'}`,
                    background: isSel ? `${portal.color}15` : 'white'
                  }}>
                    <input type="checkbox" checked={isSel} onChange={() => handlePortalToggle(portal.id)} style={{ display: 'none' }} />
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${isSel ? portal.color : '#CBD5E1'}`, background: isSel ? portal.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSel && <Check size={12} color="white" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>{portal.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel: AI Analysis & Launch */}
      <div className="center-panel" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {selectedResume ? (
          isAnalyzing ? (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
              <Loader2 className="lucide-spin text-gradient" size={48} style={{ marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Analyzing Resume...</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>Extracting skills, experience, and role recommendations using AI.</p>
            </div>
          ) : analysisData ? (
            <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '1.5rem', opacity: 0.1 }}>
                <BrainCircuit size={120} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Sparkles size={24} color="var(--accent)" />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>AI Career Analysis</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experience (Estimated)</span>
                  <span className="text-gradient" style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.2 }}>{analysisData.experience_years} Yrs</span>
                </div>
                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills Extracted</span>
                  <span style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--primary)' }}>{analysisData.skills ? analysisData.skills.length : 0}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Top Skills Detected</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {analysisData.skills && analysisData.skills.map(skill => <span key={skill} className="badge badge-primary">{skill}</span>)}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Recommended Roles (Click to Target)</h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
                      style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', background: 'white', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px dashed var(--border)' }}
                    >
                      <CheckCircle2 size={14} color="var(--success)" /> {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
              <FileText size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Awaiting Analysis</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>Loading analysis data for {selectedResume}...</p>
            </div>
          )
        ) : (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
            <FileText size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Awaiting Knowledge Base</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>Upload a resume in the left panel to unlock the AI Career Analysis and personalized recommendations.</p>
          </div>
        )}

        {/* AI Launch Controls */}
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', background: 'var(--bg-app)' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="var(--accent)" /> Auto-Apply Mode
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI will draft & submit applications autonomously</div>
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
            style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}
          >
            {isRunning ? (
              <><Loader2 className="lucide-spin" size={20} /> Initializing Agent...</>
            ) : (
              <><Play size={20} fill="currentColor" /> Launch AI Job Agent</>
            )}
          </button>
        </div>

      </div>

      {/* Right Panel: Live Activity Feed */}
      <div className="right-panel">
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Activity size={20} color={isRunning ? "var(--success)" : "var(--text-muted)"} /> 
          Live Activity
        </h2>
        
        <div className="card" style={{ height: 'calc(100vh - 120px)', overflowY: 'auto', background: '#FFFFFF', padding: '1rem' }}>
          {logs && logs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {logs.slice().reverse().map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <ChevronRight size={14} style={{ marginTop: '0.15rem', color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.4 }}>{log}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
              <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '50%', marginBottom: '1rem' }}>
                <Terminal size={24} />
              </div>
              <p style={{ fontSize: '0.9rem' }}>Agent is resting.<br/>Launch to see activity feed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
