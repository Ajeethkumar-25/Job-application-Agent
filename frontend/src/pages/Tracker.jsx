import React, { useState, useEffect } from 'react';
import { Download, Edit2, Trash2, ExternalLink, Activity, MessageSquare, User, Sparkles, BarChart2, CheckCircle2, XCircle, Mail, Send } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const [trackerData, setTrackerData] = useState([]);
  
  const [editModal, setEditModal] = useState({ isOpen: false, company: '', jobTitle: '', status: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, company: '', jobTitle: '' });
  const [clearModal, setClearModal] = useState(false);
  const [messageModal, setMessageModal] = useState({ isOpen: false, content: '', company: '', jobTitle: '' });
  const [suggestionModal, setSuggestionModal] = useState({ isOpen: false, content: '', company: '', jobTitle: '' });
  const [emailModal, setEmailModal] = useState({ isOpen: false, email: '', status: 'idle', message: '' });
  const [smtpConfig, setSmtpConfig] = useState({
    configured: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_from: '',
    smtp_password: '',
    has_password: false,
    showConfig: false,
    saveStatus: 'idle',
    saveError: ''
  });
  const [selectedAppIds, setSelectedAppIds] = useState([]);

  useEffect(() => {
    if (trackerData.length > 0) {
      const allIds = trackerData.map(app => app.id).filter(id => id !== undefined);
      setSelectedAppIds(allIds);
    } else {
      setSelectedAppIds([]);
    }
  }, [trackerData]);

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

  const handleOpenEmailModal = async () => {
    setEmailModal({ isOpen: true, email: user?.email || '', status: 'idle', message: '' });
    
    // Fetch SMTP settings (GET method)
    try {
      const res = await axios.get(`${API_BASE_URL}/tracker/smtp-settings`);
      const data = res.data;
      setSmtpConfig({
        configured: data.configured,
        smtp_host: data.smtp_host || '',
        smtp_port: data.smtp_port || 587,
        smtp_user: data.smtp_user || '',
        smtp_from: data.smtp_from || '',
        smtp_password: data.has_password ? '••••••••' : '',
        has_password: data.has_password,
        showConfig: false,
        saveStatus: 'idle',
        saveError: ''
      });
    } catch (err) {
      console.error("Failed to fetch SMTP settings:", err);
    }
  };

  const handleSaveSmtpSettings = async (e) => {
    if (e) e.preventDefault();
    setSmtpConfig(prev => ({ ...prev, saveStatus: 'saving', saveError: '' }));
    try {
      const formData = new FormData();
      formData.append('smtp_host', smtpConfig.smtp_host);
      formData.append('smtp_port', String(smtpConfig.smtp_port));
      formData.append('smtp_user', smtpConfig.smtp_user);
      formData.append('smtp_password', smtpConfig.smtp_password);
      if (smtpConfig.smtp_from) {
        formData.append('smtp_from', smtpConfig.smtp_from);
      }
      
      await axios.put(`${API_BASE_URL}/tracker/smtp-settings`, formData);
      setSmtpConfig(prev => ({ 
        ...prev, 
        configured: true, 
        has_password: smtpConfig.smtp_password !== '',
        saveStatus: 'saved' 
      }));
      setTimeout(() => {
        setSmtpConfig(prev => ({ ...prev, saveStatus: 'idle' }));
      }, 2000);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to save SMTP settings.';
      setSmtpConfig(prev => ({ ...prev, saveStatus: 'error', saveError: errMsg }));
    }
  };

  const handleClearSmtpSettings = async () => {
    if (!window.confirm("Are you sure you want to clear your custom SMTP configuration?")) return;
    setSmtpConfig(prev => ({ ...prev, saveStatus: 'saving', saveError: '' }));
    try {
      await axios.delete(`${API_BASE_URL}/tracker/smtp-settings`);
      setSmtpConfig({
        configured: false,
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_from: '',
        smtp_password: '',
        has_password: false,
        showConfig: true,
        saveStatus: 'idle',
        saveError: ''
      });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to clear SMTP settings.';
      setSmtpConfig(prev => ({ ...prev, saveStatus: 'error', saveError: errMsg }));
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailModal.email) return;
    if (selectedAppIds.length === 0) return;

    setEmailModal(prev => ({ ...prev, status: 'sending', message: '' }));
    try {
      const formData = new FormData();
      formData.append('email', emailModal.email);
      formData.append('app_ids', selectedAppIds.join(','));
      await axios.post(`${API_BASE_URL}/tracker/send-email`, formData);
      setEmailModal(prev => ({ ...prev, status: 'success', message: `Applications tracker list (${selectedAppIds.length} selected) has been sent successfully!` }));
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to send email. Please check your network and SMTP configuration.';
      setEmailModal(prev => ({ ...prev, status: 'error', message: errMsg }));
    }
  };

  const totalPages = Math.ceil(trackerData.length / itemsPerPage);
  const paginatedData = trackerData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem', width: '100%' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-gradient" style={{ marginBottom: '0.25rem', fontSize: '1.75rem', fontWeight: 800 }}>Applications Tracker</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Monitor and manage AI-driven job applications.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: selectedAppIds.length === 0 ? 0.6 : 1 }}
            onClick={handleOpenEmailModal}
            disabled={selectedAppIds.length === 0}
          >
            <Mail size={15} /> Send Email ({selectedAppIds.length})
          </button>
          <button 
            className="btn" 
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)' }} 
            onClick={() => {
              const link = document.createElement('a');
              link.href = `${API_BASE_URL}/tracker/export`;
              link.download = 'applications_tracker.zip';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download size={15} /> Export ZIP
          </button>
          <button className="btn btn-secondary" onClick={fetchTracker}>
            <Activity size={15} /> Refresh
          </button>
          <button className="btn btn-danger" onClick={handleClearTracker}>
            <Trash2 size={15} /> Clear Data
          </button>
        </div>
      </div>
      
      {/* Analytics Dashboard */}
      {trackerData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--primary-glow)', borderRadius: '10px', color: 'var(--primary)', display: 'flex' }}>
              <BarChart2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scanned Jobs</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>{trackerData.length}</div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--accent-glow)', borderRadius: '10px', color: 'var(--accent)', display: 'flex' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applied</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                {trackerData.filter(a => !a["Application Status"]?.includes("Skipped")).length}
              </div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', color: 'var(--danger)', display: 'flex' }}>
              <XCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skipped (Low Match)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                {trackerData.filter(a => a["Application Status"]?.includes("Skipped")).length}
              </div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--primary-glow)', borderRadius: '10px', color: 'var(--primary)', display: 'flex' }}>
              <Activity size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg ATS Match</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
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
                <th style={{ width: '40px', paddingLeft: '1.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={trackerData.length > 0 && selectedAppIds.length === trackerData.length} 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAppIds(trackerData.map(app => app.id).filter(id => id !== undefined));
                      } else {
                        setSelectedAppIds([]);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
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
                  <td colSpan="9" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '50%', marginBottom: '1rem' }}>
                      <Activity size={24} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No applications tracked yet.</div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((app, idx) => {
                  const source = app["Source"] || "LinkedIn";
                  const sourceColor = getPortalColor(source);

                  let statusColor = 'var(--primary)';
                  let statusBg = 'var(--primary-glow)';
                  let statusBorder = 'var(--border-highlight)';
                  
                  if (app["Application Status"]?.includes('Applied')) {
                    statusColor = 'var(--success)';
                    statusBg = 'var(--accent-glow)';
                    statusBorder = 'rgba(16, 185, 129, 0.25)';
                  } else if (app["Application Status"]?.includes('Redirect')) {
                    statusColor = 'var(--info)';
                    statusBg = 'rgba(59, 130, 246, 0.08)';
                    statusBorder = 'rgba(59, 130, 246, 0.2)';
                  } else if (app["Application Status"]?.includes('Reject') || app["Application Status"]?.includes('Skipped')) {
                    statusColor = 'var(--danger)';
                    statusBg = 'rgba(239, 68, 68, 0.08)';
                    statusBorder = 'rgba(239, 68, 68, 0.2)';
                  }

                  const isChecked = selectedAppIds.includes(app.id);

                  return (
                    <tr key={idx} style={{ background: isChecked ? 'var(--primary-glow)' : 'transparent' }}>
                      <td style={{ paddingLeft: '1.5rem' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAppIds(prev => [...prev, app.id]);
                            } else {
                              setSelectedAppIds(prev => prev.filter(id => id !== app.id));
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.65rem', borderRadius: '6px',
                          background: `${sourceColor}18`, color: sourceColor,
                          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                          {source}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-main)', fontWeight: 700 }}>{app.Company}</td>
                      <td>
                        <a href={app["Job Link"]} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', transition: 'color 0.2s', fontWeight: 600 }} onMouseOver={(e) => e.currentTarget.style.color='var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color='var(--text-muted)'}>
                          {app["Job Title"]}
                          <ExternalLink size={12} style={{ opacity: 0.7 }} />
                        </a>
                      </td>
                      <td>
                        {app["HR Contact"] && (app["HR Contact"].startsWith('http') || app["HR Contact"].startsWith('www')) ? (
                          <a href={app["HR Contact"].startsWith('http') ? app["HR Contact"] : `https://${app["HR Contact"]}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600 }}>
                            <User size={12} /> Profile
                            <ExternalLink size={10} style={{ opacity: 0.7 }} />
                          </a>
                        ) : (
                          <span style={{ opacity: app["HR Contact"] ? 1 : 0.4, fontSize: '0.85rem' }}>{app["HR Contact"] || 'N/A'}</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: app["ATS Score"] >= 85 ? 'var(--success)' : (app["ATS Score"] !== "" && app["ATS Score"] !== undefined ? 'var(--danger)' : 'var(--text-muted)') }}>
                          {app["ATS Score"] !== "" && app["ATS Score"] !== undefined ? `${app["ATS Score"]}%` : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ color: statusColor, background: statusBg, border: `1px solid ${statusBorder}` }}>
                          {app["Application Status"]}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app["Applied Date"]}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button 
                            onClick={() => setMessageModal({ isOpen: true, content: app["Drafted Message"] || '', company: app.Company, jobTitle: app["Job Title"] })}
                            style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '0.4rem', borderRadius: '6px', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color='var(--primary-hover)'; e.currentTarget.style.background='var(--primary-glow)' }}
                            onMouseOut={(e) => { e.currentTarget.style.color='var(--primary)'; e.currentTarget.style.background='var(--bg-app)' }}
                            title="View Drafted Message"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button 
                            onClick={() => setSuggestionModal({ isOpen: true, content: app["Improvement Suggestions"] || 'No improvement suggestions available for this application.', company: app.Company, jobTitle: app["Job Title"] })}
                            style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '0.4rem', borderRadius: '6px', color: 'var(--success)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color='var(--accent-hover)'; e.currentTarget.style.background='var(--accent-glow)' }}
                            onMouseOut={(e) => { e.currentTarget.style.color='var(--success)'; e.currentTarget.style.background='var(--bg-app)' }}
                            title="View AI Suggestions"
                          >
                            <Sparkles size={14} />
                          </button>
                          <button 
                            onClick={() => handleEditStatus(app.Company, app["Job Title"], app["Application Status"])}
                            style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '0.4rem', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color='var(--text-main)'; e.currentTarget.style.background='var(--border)' }}
                            onMouseOut={(e) => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='var(--bg-app)' }}
                            title="Edit Status"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteApp(app.Company, app["Job Title"])}
                            style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '0.4rem', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color='#FFFFFF'; e.currentTarget.style.background='var(--danger)' }}
                            onMouseOut={(e) => { e.currentTarget.style.color='var(--danger)'; e.currentTarget.style.background='var(--bg-app)' }}
                            title="Delete Application"
                          >
                            <Trash2 size={14} />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'var(--bg-app)', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, trackerData.length)} of {trackerData.length} entries
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', opacity: currentPage === Math.ceil(trackerData.length / itemsPerPage) ? 0.5 : 1 }}
                disabled={currentPage === Math.ceil(trackerData.length / itemsPerPage)}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(trackerData.length / itemsPerPage), p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Aurora Modals */}
      {clearModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(3, 7, 18, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '400px', border: '1px solid var(--danger)', boxShadow: '0 10px 40px rgba(239, 68, 68, 0.15)' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>Clear All Data</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>This will permanently erase all tracking data from the database. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => setClearModal(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ padding: '0.5rem 1rem' }} onClick={confirmClearTracker}>Erase Data</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(3, 7, 18, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '400px', border: '1px solid var(--danger)', boxShadow: '0 10px 40px rgba(239, 68, 68, 0.15)' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>Delete Application</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>Remove application for <strong style={{color:'var(--text-main)'}}>{deleteModal.jobTitle}</strong> at <strong style={{color:'var(--text-main)'}}>{deleteModal.company}</strong>?</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => setDeleteModal({ isOpen: false, company: '', jobTitle: '' })}>Cancel</button>
              <button className="btn btn-danger" style={{ padding: '0.5rem 1rem' }} onClick={confirmDeleteApp}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {editModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(3, 7, 18, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '400px', border: '1px solid var(--border-highlight)', boxShadow: '0 10px 40px var(--primary-glow)' }}>
            <h2 className="text-gradient" style={{ marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>Edit Status</h2>
            <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Update status for <strong style={{color:'var(--text-main)'}}>{editModal.jobTitle}</strong> at <strong style={{color:'var(--text-main)'}}>{editModal.company}</strong></p>
            <input 
              type="text" 
              className="form-input" 
              style={{ marginBottom: '1.5rem' }}
              value={editModal.status} 
              onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}
              placeholder="e.g. Applied, Interviewing, Rejected"
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => setEditModal({ isOpen: false, company: '', jobTitle: '', status: '' })}>Cancel</button>
              <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={confirmEditStatus}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {messageModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(3, 7, 18, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '600px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-highlight)' }}>
            <h2 className="text-gradient" style={{ marginBottom: '0.25rem', fontWeight: 800, fontSize: '1.25rem' }}>Edit AI Drafted Message</h2>
            <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Message for <strong style={{color:'var(--text-main)'}}>{messageModal.jobTitle}</strong> at <strong style={{color:'var(--text-main)'}}>{messageModal.company}</strong></p>
            
            <textarea 
              style={{ 
                background: 'var(--bg-app)', 
                padding: '1.25rem', 
                borderRadius: '10px', 
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                lineHeight: '1.6',
                flexGrow: 1,
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                minHeight: '200px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s'
              }}
              className="form-input"
              value={messageModal.content}
              onChange={(e) => setMessageModal({...messageModal, content: e.target.value})}
              placeholder="Draft your message here..."
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => setMessageModal({ isOpen: false, content: '', company: '', jobTitle: '' })}>Cancel</button>
              <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={confirmEditMessage}>Save Message</button>
            </div>
          </div>
        </div>
      )}

      {suggestionModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(3, 7, 18, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '600px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h2 className="text-gradient-accent" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>
              <Sparkles size={20} /> AI Improvement Suggestions
            </h2>
            <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Suggestions to improve ATS match for <strong style={{color:'var(--text-main)'}}>{suggestionModal.jobTitle}</strong> at <strong style={{color:'var(--text-main)'}}>{suggestionModal.company}</strong></p>
            
            <div style={{ 
              background: 'var(--bg-app)', 
              padding: '1.25rem', 
              borderRadius: '10px', 
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              flexGrow: 1,
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              {suggestionModal.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-accent" style={{ padding: '0.5rem 1.25rem' }} onClick={() => setSuggestionModal({ isOpen: false, content: '', company: '', jobTitle: '' })}>Close</button>
            </div>
          </div>
        </div>
      )}

      {emailModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(3, 7, 18, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ width: '500px', maxWidth: '90vw', border: '1px solid var(--border-highlight)', boxShadow: '0 10px 40px var(--primary-glow)' }}>
            <h2 className="text-gradient" style={{ marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={20} /> Send Tracker via Email
            </h2>
            
            {emailModal.status === 'success' ? (
              <div style={{ margin: '1.5rem 0' }}>
                <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={18} /> Success
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  {emailModal.message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }} onClick={() => setEmailModal({ isOpen: false, email: '', status: 'idle', message: '' })}>Close</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} style={{ marginTop: '1rem' }}>
                <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  Send your current job applications list as an Excel spreadsheet attachment along with an executive summary table.
                </p>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Recipient Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={emailModal.email} 
                    onChange={(e) => setEmailModal({ ...emailModal, email: e.target.value })}
                    placeholder="e.g. name@example.com"
                    required
                    disabled={emailModal.status === 'sending'}
                    autoFocus
                  />
                </div>

                {/* Collapsible SMTP Config Section */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setSmtpConfig(prev => ({ ...prev, showConfig: !prev.showConfig }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: 0
                    }}
                  >
                    <span>{smtpConfig.showConfig ? '▼' : '▶'}</span>
                    Custom SMTP Settings {smtpConfig.configured ? '(Configured)' : '(Not Configured)'}
                  </button>

                  {smtpConfig.showConfig && (
                    <div style={{ marginTop: '1rem', background: 'var(--primary-glow)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border-highlight)' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>SMTP Host</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                          value={smtpConfig.smtp_host}
                          onChange={e => setSmtpConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                          placeholder="e.g. smtp.gmail.com"
                          required={smtpConfig.showConfig}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>SMTP Port</label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            value={smtpConfig.smtp_port}
                            onChange={e => setSmtpConfig(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                            placeholder="587"
                            required={smtpConfig.showConfig}
                          />
                        </div>
                        <div style={{ flex: 2 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>SMTP Sender Email (From)</label>
                          <input
                            type="email"
                            className="form-input"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                            value={smtpConfig.smtp_from || ''}
                            onChange={e => setSmtpConfig(prev => ({ ...prev, smtp_from: e.target.value }))}
                            placeholder="optional - defaults to user"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>SMTP Username (User)</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                          value={smtpConfig.smtp_user}
                          onChange={e => setSmtpConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
                          placeholder="e.g. name@example.com"
                          required={smtpConfig.showConfig}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>SMTP Password</label>
                        <input
                          type="password"
                          className="form-input"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                          value={smtpConfig.smtp_password}
                          onChange={e => setSmtpConfig(prev => ({ ...prev, smtp_password: e.target.value }))}
                          placeholder={smtpConfig.has_password ? '••••••••' : 'Enter SMTP password'}
                          required={smtpConfig.showConfig && !smtpConfig.has_password}
                        />
                      </div>

                      {smtpConfig.saveError && (
                        <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          {smtpConfig.saveError}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        {smtpConfig.configured && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={handleClearSmtpSettings}
                            disabled={smtpConfig.saveStatus === 'saving'}
                          >
                            Delete Credentials
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={handleSaveSmtpSettings}
                          disabled={smtpConfig.saveStatus === 'saving' || !smtpConfig.smtp_host || !smtpConfig.smtp_user}
                        >
                          {smtpConfig.saveStatus === 'saving' ? 'Saving...' : smtpConfig.saveStatus === 'saved' ? 'Saved! ✓' : 'Save Config (PUT)'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {emailModal.status === 'error' && (
                  <div style={{ 
                    background: 'rgba(239, 68, 68, 0.06)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    marginBottom: '1.25rem',
                    fontSize: '0.8rem',
                    color: 'var(--danger)',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Error Sending Email</div>
                    {emailModal.message}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem 1rem' }} 
                    onClick={() => setEmailModal({ isOpen: false, email: '', status: 'idle', message: '' })}
                    disabled={emailModal.status === 'sending'}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    disabled={emailModal.status === 'sending' || !emailModal.email}
                  >
                    {emailModal.status === 'sending' ? (
                      <>
                        <span className="lucide-spin" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #FFF', borderTopColor: 'transparent', borderRadius: '50%', marginRight: '8px' }}></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
