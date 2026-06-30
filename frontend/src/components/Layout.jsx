import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LayoutDashboard, Radio, Briefcase, BarChart2, Settings, User, Sparkles, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const menuRef = useRef(null);

  // Apply theme class to HTML node
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync theme changes across tabs/components
  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
        background: 'var(--bg-header)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 2rem',
        boxShadow: 'var(--shadow-sm)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
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
          <nav style={{ display: 'flex', gap: '0.25rem' }}>
            <NavLink to="/" end style={getNavStyle}><LayoutDashboard size={16} />Launchpad</NavLink>
            <NavLink to="/logs" style={getNavStyle}><Radio size={16} />Live Agent</NavLink>
            <NavLink to="/tracker" style={getNavStyle}><Briefcase size={16} />Applications</NavLink>
            <NavLink to="/analytics" style={getNavStyle}><BarChart2 size={16} />Analytics</NavLink>
            <NavLink to="/settings" style={getNavStyle}><Settings size={16} />Settings</NavLink>
          </nav>

          {/* Controls: Theme Toggle + User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Profile Dropdown */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                id="user-menu-btn"
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.35rem 0.75rem 0.35rem 0.35rem',
                  background: 'var(--bg-card)', borderRadius: '999px',
                  cursor: 'pointer', border: '1px solid var(--border)',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name || user?.email || 'Account'}
                </span>
                <ChevronDown size={12} color="var(--text-muted)" style={{ transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
                  minWidth: '200px', overflow: 'hidden', zIndex: 200
                }}>
                  {/* User info */}
                  <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.full_name || 'User'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                  </div>
                  {/* Sign out */}
                  <button
                    id="signout-btn"
                    onClick={handleLogout}
                    style={{
                      width: '100%', padding: '0.75rem 1rem',
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 600,
                      transition: 'background 0.15s', textAlign: 'left'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
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
  padding: '0.5rem 0.85rem',
  borderRadius: '8px',
  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
  backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
  fontWeight: isActive ? 700 : 500,
  fontSize: '0.85rem',
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  transition: 'all 0.2s ease',
  cursor: 'pointer'
});

export default Layout;
