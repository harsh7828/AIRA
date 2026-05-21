import React, { useState, useCallback } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { ServerUrl } from '../App'

const ease = [0.22, 1, 0.36, 1]

const Mono = ({ children, style }) => (
  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', ...style }}>{children}</span>
)

const ScoreGauge = ({ score }) => {
  const r = 52, circ = 2 * Math.PI * r, pct = score / 100
  const color = score >= 80 ? 'var(--accent)' : score >= 60 ? 'var(--gold)' : 'var(--danger)'
  const label = score >= 80 ? 'Strong' : score >= 60 ? 'Moderate' : 'Needs Work'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div style={{ position: 'relative', width: '124px', height: '124px' }}>
        <svg width="124" height="124" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="62" cy="62" r={r} stroke="var(--border)" strokeWidth="7" fill="none"/>
          <motion.circle cx="62" cy="62" r={r} stroke={color} strokeWidth="7" fill="none"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - circ * pct }}
            transition={{ duration: 1.2, ease, delay: 0.2 }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {score}
          </motion.span>
          <Mono style={{ fontSize: '0.575rem', display: 'inline', marginTop: '2px' }}>/ 100</Mono>
        </div>
      </div>
      <span className={`badge ${score >= 80 ? 'badge-accent' : score >= 60 ? 'badge-gold' : 'badge-danger'}`}>{label}</span>
    </div>
  )
}

const InsightCard = ({ items, type }) => {
  if (!items?.length) return null
  const isWarn = type === 'shortcoming'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', gap: '11px', padding: '12px 14px',
          background: isWarn ? 'var(--danger-dim)' : 'var(--accent-dim)',
          border: `1px solid ${isWarn ? 'var(--danger-border)' : 'var(--accent-border)'}`,
          borderRadius: '10px',
        }}>
          <div style={{ paddingTop: '1px', flexShrink: 0, color: isWarn ? 'var(--danger)' : 'var(--accent)' }}>
            {isWarn
              ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 4.5v3M6.5 9v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M5.633 1.5L1.035 9a1 1 0 00.867 1.5h9.196A1 1 0 0012 9L7.367 1.5a1 1 0 00-1.734 0z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
              : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'Inter' }}>{item}</p>
        </div>
      ))}
    </div>
  )
}

export default function ResumeAnalyzer() {
  const [file, setFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [drag, setDrag] = useState(false)

  const analyze = async () => {
    if (!file || analyzing) return
    setAnalyzing(true)
    const fd = new FormData(); fd.append('resume', file)
    try {
      const res = await axios.post(ServerUrl + '/api/interview/resume', fd, { withCredentials: true })
      setResult(res.data)
    } catch (e) { console.error(e) }
    finally { setAnalyzing(false) }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setFile(f)
  }, [])

  const panelStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '72px 32px 96px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease }}
          style={{ marginBottom: '48px' }}>
          <Mono style={{ marginBottom: '12px' }}>Resume Intelligence</Mono>
          <h1 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 3.5vw, 2.625rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '12px' }}>
            ATS & Communication Analyzer
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.7 }}>
            Upload your resume for ATS compatibility scoring, semantic gap analysis, and targeted improvement intelligence.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease }}
              style={{ maxWidth: '520px' }}>

              {/* Drop zone */}
              <div
                id="resume-dropzone"
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('resume-upload').click()}
                style={{
                  border: `1.5px dashed ${drag ? 'var(--accent)' : file ? 'var(--border-strong)' : 'var(--border)'}`,
                  borderRadius: '16px', padding: '52px 32px', cursor: 'pointer', textAlign: 'center',
                  background: drag ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                  transition: 'all 180ms',
                }}
              >
                <input type="file" accept="application/pdf" id="resume-upload" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />

                {/* Upload icon */}
                <div style={{ color: file ? 'var(--accent)' : 'var(--text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M10.667 21.333A6 6 0 0112 9h.03A9 9 0 0130 16v.75A4.5 4.5 0 0125.5 25.5H21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 25.5v-9M16 16.5l-3.5 3.5M16 16.5l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {file ? (
                  <>
                    <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--accent)', marginBottom: '4px' }}>{file.name}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Click to replace</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '6px' }}>Drop your resume here</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>or click to browse files</p>
                    <span className="badge badge-neutral">PDF only</span>
                  </>
                )}
              </div>

              {file && (
                <motion.button id="analyze-resume-btn" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease }}
                  onClick={analyze} disabled={analyzing} className="btn-primary"
                  style={{ width: '100%', marginTop: '12px', padding: '13px', justifyContent: 'center' }}>
                  {analyzing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {[0,1,2].map(i => <div key={i} className="thinking-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
                      Analyzing resume…
                    </span>
                  ) : 'Analyze resume'}
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease }}>
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>

                {/* Left */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ ...panelStyle, textAlign: 'center' }}>
                    <Mono style={{ marginBottom: '20px' }}>ATS Match Score</Mono>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                      <ScoreGauge score={result.atsScore} />
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'Inter', marginTop: '14px' }}>{result.atsFeedback}</p>
                    <button id="analyze-another-btn" onClick={() => { setResult(null); setFile(null) }} className="btn-ghost"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '9px' }}>
                      Analyze another
                    </button>
                  </div>

                  {/* Extracted details */}
                  <div style={panelStyle}>
                    <Mono style={{ marginBottom: '16px' }}>Extracted Details</Mono>
                    {[['Target Role', result.role], ['Experience Level', result.experience]].map(([l, v]) => v && (
                      <div key={l} style={{ marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Inter', marginBottom: '5px' }}>{l}</p>
                        <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 11px' }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={panelStyle}>
                    <Mono style={{ marginBottom: '16px' }}>Improvement Suggestions</Mono>
                    <InsightCard items={result.suggestions} type="suggestion" />
                    {!result.suggestions?.length && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No suggestions — well-structured resume.</p>}
                  </div>
                  <div style={panelStyle}>
                    <Mono style={{ marginBottom: '16px' }}>Identified Shortcomings</Mono>
                    <InsightCard items={result.shortcomings} type="shortcoming" />
                    {!result.shortcomings?.length && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No significant shortcomings identified.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
