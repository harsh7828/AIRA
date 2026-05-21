import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { ServerUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import AuthModel from './AuthModel'

/* ── Logo mark — emerald ── */
const Logo = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <defs>
      <linearGradient id="logo-grad" x1="0" y1="0" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1C1C1C"/>
        <stop offset="100%" stopColor="#111111"/>
      </linearGradient>
    </defs>
    <rect width="22" height="22" rx="6" fill="url(#logo-grad)" stroke="rgba(57,255,20,0.2)" strokeWidth="1"/>
    <path d="M6 16L11 6L16 16" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 12.5H14" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
)

const Sun = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M7 1.5V2.5M7 11.5V12.5M1.5 7H2.5M11.5 7H12.5M3 3L3.7 3.7M10.3 10.3L11 11M3 11L3.7 10.3M10.3 3.7L11 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const Moon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M11.5 9A5.5 5.5 0 015 2.5 5.5 5.5 0 1011.5 9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const Coin = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.25"/>
    <path d="M6 3v6M4.5 4.5h2a1.5 1.5 0 010 3H4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)

const ChevronDown = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
    <path d="M2.5 4L5 6.5 7.5 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const navLinks = [
  { label: 'Home',      path: '/' },
  { label: 'Interview', path: '/interview' },
  { label: 'Analytics', path: '/history' },
  { label: 'Resume AI', path: '/resume-analyzer' },
  { label: 'Pricing',   path: '/pricing' },
]

const ease = [0.22, 1, 0.36, 1]

export default function Navbar() {
  const { userData } = useSelector(s => s.user)
  const [showCredit, setShowCredit]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAuth, setShowAuth]       = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const [isLight, setIsLight] = useState(() => localStorage.getItem('theme') === 'light')
  const navigate  = useNavigate()
  const location  = useLocation()
  const dispatch  = useDispatch()

  useEffect(() => {
    if (isLight) { document.documentElement.classList.add('light'); localStorage.setItem('theme', 'light') }
    else         { document.documentElement.classList.remove('light'); localStorage.setItem('theme', 'dark') }
  }, [isLight])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest('[data-popup]')) { setShowCredit(false); setShowProfile(false) }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + '/api/auth/logout', { withCredentials: true })
      dispatch(setUserData(null)); setShowProfile(false); navigate('/')
    } catch {}
  }

  const go = (path) => {
    if (['/interview', '/history', '/resume-analyzer'].includes(path) && !userData) {
      setShowAuth(true); return
    }
    navigate(path)
  }

  const popoverAnim = {
    initial:    { opacity: 0, y: 6, scale: 0.97 },
    animate:    { opacity: 1, y: 0, scale: 1 },
    exit:       { opacity: 0, y: 3, scale: 0.98 },
    transition: { duration: 0.14, ease },
  }

  return (
    <>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        transition: 'box-shadow 200ms',
        boxShadow: scrolled ? '0 1px 24px rgba(0,0,0,0.6)' : 'none',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          height: '58px',
          padding: '0 32px',
        }}>

          {/* Logo */}
          <button
            id="navbar-logo"
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              flexShrink: 0, marginRight: '36px',
            }}
          >
            <Logo />
            <span style={{
              fontFamily: 'Satoshi, Inter, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}>
              AIRA
            </span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.5rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginLeft: '-2px',
              alignSelf: 'flex-end',
              marginBottom: '2px',
            }}>
              Intelligence
            </span>
          </button>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px', flex: 1 }}>
            {navLinks.map(link => {
              const active = location.pathname === link.path
              return (
                <button
                  key={link.path}
                  id={`nav-${link.label.toLowerCase().replace(/\s+/g,'-')}`}
                  onClick={() => go(link.path)}
                  style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '7px 12px',
                    borderRadius: '7px',
                    fontSize: '0.8125rem',
                    fontWeight: active ? 500 : 400,
                    fontFamily: 'Inter, sans-serif',
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'color 120ms',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      style={{
                        position: 'absolute', bottom: '-1px', left: '8px', right: '8px',
                        height: '1.5px', borderRadius: '2px 2px 0 0',
                        background: 'var(--accent)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>

            {/* Theme toggle */}
            <button
              id="theme-toggle"
              aria-label="Toggle theme"
              onClick={() => setIsLight(!isLight)}
              style={{
                width: '30px', height: '30px', borderRadius: '7px',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 120ms, background 120ms, border-color 120ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {isLight ? <Sun /> : <Moon />}
            </button>

            {/* Credits */}
            <div style={{ position: 'relative' }} data-popup="credit">
              <button
                id="credits-badge"
                onClick={() => { if (!userData) { setShowAuth(true); return }; setShowCredit(!showCredit); setShowProfile(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: 'var(--gold-dim)',
                  border: '1px solid var(--gold-border)',
                  borderRadius: '7px', padding: '5px 10px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.6875rem', fontWeight: 500,
                  color: 'var(--gold)',
                  cursor: 'pointer',
                  transition: 'background 120ms',
                }}
              >
                <Coin />
                <span>{userData?.credits ?? 0}</span>
              </button>

              <AnimatePresence>
                {showCredit && (
                  <motion.div
                    {...popoverAnim}
                    data-popup="credit"
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px', padding: '6px',
                      boxShadow: 'var(--shadow-lg)', zIndex: 300, minWidth: '220px',
                    }}
                  >
                    <div style={{ padding: '12px 14px 14px', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
                      <p style={{ fontFamily: "'IBM Plex Mono'", fontSize: '0.575rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Available Credits
                      </p>
                      <p style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '2rem', color: 'var(--gold)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        {userData?.credits ?? 0}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Inter', marginTop: '4px' }}>
                        credits remaining
                      </p>
                    </div>
                    <button
                      style={{
                        width: '100%', textAlign: 'left', padding: '9px 12px',
                        borderRadius: '8px', background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
                        fontFamily: 'Inter, sans-serif', color: 'var(--text-secondary)',
                        transition: 'background 100ms, color 100ms',
                      }}
                      onClick={() => { navigate('/pricing'); setShowCredit(false) }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                    >
                      Purchase credits →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            {userData ? (
              <div style={{ position: 'relative' }} data-popup="profile">
                <button
                  id="profile-avatar"
                  onClick={() => { setShowProfile(!showProfile); setShowCredit(false) }}
                  style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid rgba(57,255,20,0.2)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 600,
                    fontSize: '0.75rem', color: 'var(--accent)',
                    transition: 'border-color 120ms, background 120ms',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(57,255,20,0.35)'; e.currentTarget.style.background = 'var(--bg-panel)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(57,255,20,0.2)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
                >
                  {userData.name?.slice(0, 1).toUpperCase()}
                </button>

                <AnimatePresence>
                  {showProfile && (
                    <motion.div
                      {...popoverAnim}
                      data-popup="profile"
                      style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px', padding: '6px',
                        boxShadow: 'var(--shadow-lg)', zIndex: 300, minWidth: '210px',
                      }}
                    >
                      <div style={{ padding: '12px 14px 14px', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'Satoshi, Inter, sans-serif', marginBottom: '2px', letterSpacing: '-0.015em' }}>
                          {userData.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Inter' }}>
                          {userData.email}
                        </p>
                      </div>
                      {[
                        { label: 'Interview History', path: '/history' },
                        { label: 'Resume Analyzer',  path: '/resume-analyzer' },
                      ].map(item => (
                        <button
                          key={item.path}
                          style={{
                            width: '100%', textAlign: 'left', padding: '9px 12px',
                            borderRadius: '8px', background: 'none', border: 'none',
                            cursor: 'pointer', fontSize: '0.8125rem',
                            fontFamily: 'Inter, sans-serif', color: 'var(--text-secondary)',
                            transition: 'background 100ms, color 100ms',
                          }}
                          onClick={() => { navigate(item.path); setShowProfile(false) }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                        >
                          {item.label}
                        </button>
                      ))}
                      <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                        <button
                          style={{
                            width: '100%', textAlign: 'left', padding: '9px 12px',
                            borderRadius: '8px', background: 'none', border: 'none',
                            cursor: 'pointer', fontSize: '0.8125rem',
                            fontFamily: 'Inter, sans-serif', color: 'var(--danger)',
                            transition: 'background 100ms',
                          }}
                          onClick={handleLogout}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-dim)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                id="signin-btn"
                className="btn-primary"
                style={{ padding: '6px 16px', fontSize: '0.8125rem', borderRadius: '7px' }}
                onClick={() => setShowAuth(true)}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </>
  )
}
