import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Radio, Briefcase, BarChart2, Settings, User, Sparkles, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // User initials avatar
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', position: 'relative' }}>

      {/* Top Navigation */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              padding: '0.5rem', borderRadius: '10px', display: 'flex',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}>
              <Sparkles size={18} color="white" />
            </div>
            <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Linker<span className="text-gradient">AI</span>
            </h1>
          </Link>

          {/* Nav Links */}
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <NavLink to="/" end style={getNavStyle}><LayoutDashboard size={18} />Launchpad</NavLink>
            <NavLink to="/logs" style={getNavStyle}><Radio size={18} />Live Agent</NavLink>
            <NavLink to="/tracker" style={getNavStyle}><Briefcase size={18} />Applications</NavLink>
            <NavLink to="/analytics" style={getNavStyle}><BarChart2 size={18} />Analytics</NavLink>
            <NavLink to="/settings" style={getNavStyle}><Settings size={18} />Settings</NavLink>
          </nav>

          {/* User Profile Dropdown */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              id="user-menu-btn"
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.4rem 0.75rem 0.4rem 0.4rem',
                background: '#F1F5F9', borderRadius: '999px',
                cursor: 'pointer', border: '1px solid #E2E8F0',
                transition: 'all 0.2s'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0
              }}>
                {initials}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-main)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name || user?.email || 'Account'}
              </span>
              <ChevronDown size={14} color="var(--text-muted)" style={{ transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'none' }} />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'white', border: '1px solid var(--border)',
                borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
                minWidth: '200px', overflow: 'hidden', zIndex: 200
              }}>
                {/* User info */}
                <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{user?.full_name || 'User'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{user?.email}</div>
                </div>
                {/* Sign out */}
                <button
                  id="signout-btn"
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 500,
                    transition: 'background 0.15s', textAlign: 'left'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        <Outlet />
      </main>
    </div>
  );
};

const getNavStyle = ({ isActive }) => ({
  textDecoration: 'none',
  padding: '0.6rem 1rem',
  borderRadius: '8px',
  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
  backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
  fontWeight: isActive ? 600 : 500,
  fontSize: '0.9rem',
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  transition: 'all 0.2s ease'
});

export default Layout;
