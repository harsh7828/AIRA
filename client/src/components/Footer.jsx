import React from 'react'
import { useNavigate } from 'react-router-dom'

const Logo = () => (
  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
    <defs>
      <linearGradient id="foot-logo-grad" x1="0" y1="0" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1C1C1C"/>
        <stop offset="100%" stopColor="#111111"/>
      </linearGradient>
    </defs>
    <rect width="22" height="22" rx="6" fill="url(#foot-logo-grad)" stroke="rgba(57,255,20,0.2)" strokeWidth="1"/>
    <path d="M6 16L11 6L16 16" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 12.5H14" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
)

const links = [
  { label: 'Dashboard',  path: '/' },
  { label: 'Interviews', path: '/interview' },
  { label: 'Analytics',  path: '/history' },
  { label: 'Resume AI',  path: '/resume-analyzer' },
  { label: 'Pricing',    path: '/pricing' },
]

export default function Footer() {
  const navigate = useNavigate()
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto',
        padding: '24px 32px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      }}>
        {/* Logo */}
        <button onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Logo />
          <span style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>AIRA</span>
        </button>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: '2px' }}>
          {links.map(l => (
            <button key={l.path} onClick={() => navigate(l.path)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px', transition: 'color 120ms' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >{l.label}</button>
          ))}
        </nav>

        {/* Attribution */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.575rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)' }}>
            © 2026 AIRA · Communication Intelligence System
          </p>
        </div>
      </div>
    </footer>
  )
}
