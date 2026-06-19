import React, { useState, useEffect } from 'react';
import { Download, Edit2, Trash2, ExternalLink, Activity, MessageSquare, User, Sparkles, BarChart2, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');

const getPortalColor = (portalId) => {
  const normalized = portalId.toLowerCase();
  switch (normalized) {
    case 'linkedin': return '#3b82f6';
    case 'naukri': return '#60a5fa';
    case 'indeed': return '#2563eb';
    case 'internshala': return '#38bdf8';
    case 'unstop': return '#f97316';
    case 'foundit': return '#8b5cf6';
    case 'instahyre': return '#10b981';
    default: return 'var(--primary)';
  }
};

export default function Tracker() {
  const [trackerData, setTrackerData] = useState([]);
  
  const [editModal, setEditModal] = useState({ isOpen: false, company: '', jobTitle: '', status: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, company: '', jobTitle: '' });
  const [clearModal, setClearModal] = useState(false);
  const [messageModal, setMessageModal] = useState({ isOpen: false, content: '', company: '', jobTitle: '' });
  const [suggestionModal, setSuggestionModal] = useState({ isOpen: false, content: '', company: '', jobTitle: '' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTracker = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/tracker`);
      setTrackerData(res.data);
    } catch (err) {
      console.error("Failed to fetch tracker data:", err);
    }
  };

  useEffect(() => {
    fetchTracker();
    const trackerInterval = setInterval(fetchTracker, 10000); 
    return () => clearInterval(trackerInterval);
  }, []);

  const handleClearTracker = () => setClearModal(true);
  const confirmClearTracker = async () => {
    try {
      await axios.post(`${API_BASE_URL}/tracker/clear`);
      fetchTracker();
      setClearModal(false);
    } catch (err) { console.error(err); }
  };

  const handleDeleteApp = (company, jobTitle) => setDeleteModal({ isOpen: true, company, jobTitle });
  const confirmDeleteApp = async () => {
    try {
      const formData = new FormData();
      formData.append('company', deleteModal.company);
      formData.append('job_title', deleteModal.jobTitle);
      await axios.post(`${API_BASE_URL}/tracker/delete`, formData);
      fetchTracker();
      setDeleteModal({ isOpen: false, company: '', jobTitle: '' });
    } catch (err) { console.error(err); }
  };

  const handleEditStatus = (company, jobTitle, currentStatus) => setEditModal({ isOpen: true, company, jobTitle, status: currentStatus });
  const confirmEditStatus = async () => {
    if (!editModal.status) return;
    try {
      const formData = new FormData();
      formData.append('company', editModal.company);
      formData.append('job_title', editModal.jobTitle);
      formData.append('status', editModal.status);
      await axios.post(`${API_BASE_URL}/tracker/update`, formData);
      fetchTracker();
      setEditModal({ isOpen: false, company: '', jobTitle: '', status: '' });
    } catch (err) { console.error(err); }
  };

  const confirmEditMessage = async () => {
    try {
      const formData = new FormData();
      formData.append('company', messageModal.company);
      formData.append('job_title', messageModal.jobTitle);
      formData.append('message', messageModal.content);
      await axios.post(`${API_BASE_URL}/tracker/update-message`, formData);
      fetchTracker();
      setMessageModal({ isOpen: false, content: '', company: '', jobTitle: '' });
    } catch (err) { console.error(err); }
  };

  const totalPages = Math.ceil(trackerData.length / itemsPerPage);
  const paginatedData = trackerData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2 className="text-gradient" style={{ marginBottom: '0.25rem', fontSize: '2rem' }}>Applications Tracker</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Monitor and manage AI-driven job applications.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn" 
            style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' }} 
            onClick={() => {
              const link = document.createElement('a');
              link.href = `${API_BASE_URL}/tracker/export`;
              link.download = 'applications_tracker.xlsx';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download size={16} /> Export CSV
          </button>
          <button className="btn" className="btn-secondary" onClick={fetchTracker}>
            <Activity size={16} /> Refresh
          </button>
          <button className="btn" className="btn-danger" onClick={handleClearTracker}>
            <Trash2 size={16} /> Clear Data
          </button>
        </div>
      </div>
      
      {/* Analytics Dashboard */}
      {trackerData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
              <BarChart2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total Jobs Evaluated</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{trackerData.length}</div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '12px', color: 'var(--success)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Jobs Applied</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {trackerData.filter(a => !a["Application Status"]?.includes("Skipped")).length}
              </div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '12px', color: 'var(--danger)' }}>
              <XCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Jobs Skipped (Low ATS)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {trackerData.filter(a => a["Application Status"]?.includes("Skipped")).length}
              </div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', color: 'var(--accent)' }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Avg ATS Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {(() => {
                  const validScores = trackerData.map(a => parseFloat(a["ATS Score"])).filter(s => !isNaN(s) && s > 0);
                  return validScores.length > 0 ? `${(validScores.reduce((a,b)=>a+b, 0) / validScores.length).toFixed(1)}%` : 'N/A';
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-grid">
            <thead>
              <tr>
                <th>Source</th>
                <th>Company</th>
                <th>Job Title</th>
                <th>HR Contact</th>
                <th>ATS Match</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: '1rem' }}>
                      <Activity size={32} opacity={0.5} />
                    </div>
                    <div>No applications tracked yet.</div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((app, idx) => {
                  const source = app["Source"] || "LinkedIn";
                  const sourceColor = getPortalColor(source);

                  let statusColor = 'var(--primary)';
                  let statusBg = 'rgba(99, 102, 241, 0.1)';
                  let statusBorder = 'rgba(99, 102, 241, 0.2)';
                  
                  if (app["Application Status"]?.includes('Applied')) {
                    statusColor = 'var(--success)';
                    statusBg = 'rgba(20, 184, 166, 0.1)';
                    statusBorder = 'rgba(20, 184, 166, 0.3)';
                  } else if (app["Application Status"]?.includes('Redirect')) {
                    statusColor = 'var(--secondary-color)';
                    statusBg = 'rgba(168, 85, 247, 0.1)';
                    statusBorder = 'rgba(168, 85, 247, 0.3)';
                  } else if (app["Application Status"]?.includes('Reject')) {
                    statusColor = 'var(--danger)';
                    statusBg = 'rgba(244, 63, 94, 0.1)';
                    statusBorder = 'rgba(244, 63, 94, 0.3)';
                  }

                  return (
                    <tr key={idx}>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '6px',
                          background: `${sourceColor}20`, color: sourceColor,
                          fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                          {source}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-main)', fontWeight: 600 }}>{app.Company}</td>
                      <td>
                        <a href={app["Job Link"]} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color='var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color='var(--text-muted)'}>
                          {app["Job Title"]}
                          <ExternalLink size={14} opacity={0.5} />
                        </a>
                      </td>
                      <td>
                        {app["HR Contact"] && (app["HR Contact"].startsWith('http') || app["HR Contact"].startsWith('www')) ? (
                          <a href={app["HR Contact"].startsWith('http') ? app["HR Contact"] : `https://${app["HR Contact"]}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                            <User size={14} /> Profile
                            <ExternalLink size={12} opacity={0.7} />
                          </a>
                        ) : (
                          <span style={{ opacity: app["HR Contact"] ? 1 : 0.4 }}>{app["HR Contact"] || 'N/A'}</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: app["ATS Score"] >= 85 ? 'var(--success)' : (app["ATS Score"] !== "" && app["ATS Score"] !== undefined ? 'var(--danger)' : 'var(--text-muted)') }}>
                          {app["ATS Score"] !== "" && app["ATS Score"] !== undefined ? `${app["ATS Score"]}%` : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ color: statusColor, background: statusBg, border: `1px solid ${statusBorder}` }}>
                          {app["Application Status"]}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{app["Applied Date"]}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => setMessageModal({ isOpen: true, content: app["Drafted Message"] || '', company: app.Company, jobTitle: app["Job Title"] })}
                            style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', padding: '0.4rem', borderRadius: '6px', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color='var(--primary-hover)'; e.currentTarget.style.background='rgba(99, 102, 241, 0.1)' }}
                            onMouseOut={(e) => { e.currentTarget.style.color='var(--primary)'; e.currentTarget.style.background='rgba(0,0,0,0.03)' }}
                            title="View Drafted Message"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button 
                            onClick={() => setSuggestionModal({ isOpen: true, content: app["Improvement Suggestions"] || 'No improvement suggestions available for this application.', company: app.Company, jobTitle: app["Job Title"] })}
                            style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', padding: '0.4rem', borderRadius: '6px', color: 'var(--success)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color='#059669'; e.currentTarget.style.background='rgba(20, 184, 166, 0.1)' }}
                            onMouseOut={(e) => { e.currentTarget.style.color='var(--success)'; e.currentTarget.style.background='rgba(0,0,0,0.03)' }}
                            title="View AI Suggestions"
                          >
                            <Sparkles size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditStatus(app.Company, app["Job Title"], app["Application Status"])}
                            style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', padding: '0.4rem', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color='var(--text-main)'; e.currentTarget.style.background='rgba(0,0,0,0.08)' }}
                            onMouseOut={(e) => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='rgba(0,0,0,0.03)' }}
                            title="Edit Status"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteApp(app.Company, app["Job Title"])}
                            style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', padding: '0.4rem', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background='rgba(244, 63, 94, 0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.background='rgba(0,0,0,0.03)'}
                            title="Delete Application"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {trackerData.length > itemsPerPage && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, trackerData.length)} of {trackerData.length} entries
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn" 
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.03)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', opacity: currentPage === 1 ? 0.5 : 1, border: '1px solid var(--border)' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous Page
              </button>
              <button 
                className="btn" 
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.03)', color: currentPage === Math.ceil(trackerData.length / itemsPerPage) ? 'var(--text-muted)' : 'var(--text-main)', opacity: currentPage === Math.ceil(trackerData.length / itemsPerPage) ? 0.5 : 1, border: '1px solid var(--border)' }}
                disabled={currentPage === Math.ceil(trackerData.length / itemsPerPage)}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(trackerData.length / itemsPerPage), p + 1))}
              >
                Next Page
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Aurora Modals */}
      {clearModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '400px', border: '1px solid rgba(244, 63, 94, 0.3)', boxShadow: '0 0 40px rgba(244, 63, 94, 0.1)' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Clear All Data</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>This will permanently erase all tracking data from the database. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)' }} onClick={() => setClearModal(false)}>Cancel</button>
              <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={confirmClearTracker}>Erase Data</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '400px', border: '1px solid rgba(244, 63, 94, 0.3)', boxShadow: '0 0 40px rgba(244, 63, 94, 0.1)' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Delete Application</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>Remove application for <strong style={{color:'var(--text-main)'}}>{deleteModal.jobTitle}</strong> at <strong style={{color:'var(--text-main)'}}>{deleteModal.company}</strong>?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)' }} onClick={() => setDeleteModal({ isOpen: false, company: '', jobTitle: '' })}>Cancel</button>
              <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={confirmDeleteApp}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {editModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '400px', border: '1px solid var(--border-highlight)', boxShadow: '0 0 40px rgba(99, 102, 241, 0.1)' }}>
            <h2 className="text-gradient" style={{ marginBottom: '1rem' }}>Edit Status</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Update status for <strong style={{color:'var(--text-main)'}}>{editModal.jobTitle}</strong> at <strong style={{color:'var(--text-main)'}}>{editModal.company}</strong></p>
            <input 
              type="text" 
              className="form-input" 
              style={{ marginBottom: '2rem' }}
              value={editModal.status} 
              onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}
              placeholder="e.g. Applied, Interviewing, Rejected"
              autoFocus
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)' }} onClick={() => setEditModal({ isOpen: false, company: '', jobTitle: '', status: '' })}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmEditStatus}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {messageModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '600px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Edit AI Drafted Message</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Message for <strong style={{color:'var(--text-main)'}}>{messageModal.jobTitle}</strong> at <strong style={{color:'var(--text-main)'}}>{messageModal.company}</strong></p>
            
            <textarea 
              style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                border: '1px solid var(--primary)',
                color: 'var(--text-main)',
                lineHeight: '1.6',
                flexGrow: 1,
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
                minHeight: '200px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              value={messageModal.content}
              onChange={(e) => setMessageModal({...messageModal, content: e.target.value})}
              placeholder="Draft your message here..."
            />

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)' }} onClick={() => setMessageModal({ isOpen: false, content: '', company: '', jobTitle: '' })}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmEditMessage}>Save Message</button>
            </div>
          </div>
        </div>
      )}

      {suggestionModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '600px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 className="text-gradient-accent" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={24} /> AI Improvement Suggestions
            </h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Suggestions to improve ATS match for <strong style={{color:'var(--text-main)'}}>{suggestionModal.jobTitle}</strong> at <strong style={{color:'var(--text-main)'}}>{suggestionModal.company}</strong></p>
            
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid var(--success)',
              color: 'var(--text-main)',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              flexGrow: 1,
              marginBottom: '1.5rem',
              fontSize: '0.95rem'
            }}>
              {suggestionModal.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-accent" onClick={() => setSuggestionModal({ isOpen: false, content: '', company: '', jobTitle: '' })}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
