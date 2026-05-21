import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import axios from 'axios'
import { ServerUrl } from '../App'
import { motion, useInView } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

const Mono = ({ children, style }) => (
  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', ...style }}>{children}</span>
)

const StatCard = ({ label, value, sub, color, trend }) => (
  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px 24px' }}>
    <Mono style={{ display: 'block', marginBottom: '12px' }}>{label}</Mono>
    <div style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '2.125rem', letterSpacing: '-0.04em', color: color || 'var(--text-primary)', marginBottom: '4px', lineHeight: 1 }}>{value}</div>
    {sub && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Inter', marginTop: '4px' }}>{sub}</p>}
  </div>
)

const SessionCard = ({ item, index, onClick }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-32px' })
  const score = item.finalScore || 0
  const scoreColor = score >= 8 ? 'var(--accent)' : score >= 5 ? 'var(--gold)' : 'var(--danger)'
  const scoreLabel = score >= 8 ? 'Excellent' : score >= 5 ? 'Moderate' : 'Needs Work'

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.2, delay: (index % 6) * 0.04, ease }}
      onClick={onClick}
      style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '22px 24px', cursor: 'pointer',
        transition: 'border-color 150ms, transform 150ms, box-shadow 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.25 }}>{item.role}</h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[item.experience, item.mode].filter(Boolean).map((t, i) => (
              <span key={i} style={{ fontFamily: "'IBM Plex Mono'", fontSize: '0.575rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '5px', padding: '2px 7px' }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, marginLeft: '16px' }}>
          <span style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '1.625rem', color: scoreColor, letterSpacing: '-0.035em', lineHeight: 1 }}>{score}</span>
          <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: '0.575rem', color: 'var(--text-muted)', marginTop: '2px' }}>/10</span>
        </div>
      </div>

      {/* Segmented score bar */}
      <div style={{ display: 'flex', gap: '2px', height: '3px', marginBottom: '14px' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ flex: 1, borderRadius: '2px', background: i < score ? scoreColor : 'var(--border)', transition: 'background 300ms' }} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: '0.575rem', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 8px', borderRadius: '99px', border: '1px solid', background: item.status === 'completed' ? 'var(--accent-dim)' : 'var(--gold-dim)', color: item.status === 'completed' ? 'var(--accent)' : 'var(--gold)', borderColor: item.status === 'completed' ? 'var(--accent-border)' : 'var(--gold-border)' }}>
          {item.status}
        </span>
        <Mono>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Mono>
      </div>
    </motion.div>
  )
}

const SkeletonCard = () => (
  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px 24px' }}>
    <div className="skeleton" style={{ height: '11px', width: '60%', marginBottom: '14px' }} />
    <div className="skeleton" style={{ height: '32px', width: '40%', marginBottom: '12px' }} />
    <div className="skeleton" style={{ height: '3px', marginBottom: '14px' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div className="skeleton" style={{ height: '18px', width: '80px' }} />
      <div className="skeleton" style={{ height: '11px', width: '90px' }} />
    </div>
  </div>
)

export default function InterviewHistory() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(ServerUrl + '/api/interview/get-interview', { withCredentials: true })
      .then(r => setInterviews(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const avg  = interviews.length ? (interviews.reduce((s, i) => s + (i.finalScore || 0), 0) / interviews.length).toFixed(1) : 0
  const best = interviews.length ? Math.max(...interviews.map(i => i.finalScore || 0)) : 0
  const done = interviews.filter(i => i.status === 'completed').length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '52px 32px 96px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease }}
          style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
            <button
              onClick={() => navigate('/')}
              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div>
              <h1 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.125rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.1 }}>Analytics Dashboard</h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'Inter', marginTop: '3px' }}>Performance intelligence across all sessions</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        {!loading && interviews.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.06, ease }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '36px' }}>
            <StatCard label="Sessions" value={interviews.length} sub="total interviews" />
            <StatCard label="Avg Score" value={`${avg}/10`} sub="all sessions" color="var(--accent)" />
            <StatCard label="Best Score" value={`${best}/10`} sub="personal record" color="var(--gold)" />
            <StatCard label="Completed" value={done} sub={`of ${interviews.length}`} />
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : interviews.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--bg-secondary)', border: '1px dashed var(--border-strong)', borderRadius: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4v6l3 3" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round"/><circle cx="10" cy="10" r="7" stroke="var(--accent)" strokeWidth="1.6"/></svg>
            </div>
            <h3 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '8px' }}>No sessions recorded</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '300px', margin: '0 auto 24px' }}>Start your first interview session to begin tracking your performance.</p>
            <button className="btn-primary" style={{ padding: '10px 22px' }} onClick={() => navigate('/interview')}>Begin session</button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))', gap: '12px' }}>
            {interviews.map((item, i) => (
              <SessionCard key={item._id} item={item} index={i} onClick={() => navigate(`/report/${item._id}`)} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
