import React, { useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useSelector } from 'react-redux'
import { motion, useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import AuthModel from '../components/AuthModel'

const ease = [0.22, 1, 0.36, 1]

const Reveal = ({ children, delay = 0 }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.26, delay, ease }}>
      {children}
    </motion.div>
  )
}

/* ── Mono label ── */
const MonoLabel = ({ children, style }) => (
  <span style={{
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.6875rem',
    fontWeight: 500,
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    display: 'block',
    ...style,
  }}>{children}</span>
)

/* ── Hero intelligence workspace panel ── */
const IntelligenceWorkspace = () => {
  const scores = [
    { label: 'Speech Clarity',    val: 87, color: 'var(--accent)' },
    { label: 'Structural Logic',  val: 91, color: 'var(--accent)' },
    { label: 'Confidence Markers',val: 78, color: 'var(--secondary)' },
    { label: 'Filler Word Rate',  val: 94, color: 'var(--accent)' },
  ]
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-strong)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xl)',
    }}>
      {/* Chrome bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 16px',
        background: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div className="status-dot live" />
          <MonoLabel style={{ display: 'inline', fontSize: '0.6rem', color: 'var(--accent)' }}>Session Active</MonoLabel>
        </div>
        <MonoLabel style={{ display: 'inline', fontSize: '0.6rem' }}>AIRA Intelligence · v2.4</MonoLabel>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['#FF5F57','#FFBD2E','#A855F7'].map(c => (
            <div key={c} style={{ width: '9px', height: '9px', borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div style={{ padding: '18px 18px 0' }}>
        <MonoLabel style={{ marginBottom: '10px' }}>Live Transcript</MonoLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontFamily: 'Inter', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Interviewer</span>
              <MonoLabel style={{ display: 'inline', fontSize: '0.6rem' }}>00:03</MonoLabel>
            </div>
            <p style={{ fontFamily: 'Inter', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Walk me through cross-functional alignment at scale.
            </p>
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-accent)', borderRadius: '10px', padding: '11px 13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontFamily: 'Inter', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>Candidate</span>
              <MonoLabel style={{ display: 'inline', fontSize: '0.6rem' }}>00:21</MonoLabel>
            </div>
            <p style={{ fontFamily: 'Inter', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              I begin by mapping stakeholder dependencies, then establish a shared decision vocabulary before any execution planning...
            </p>
          </div>
        </div>
      </div>

      {/* Communication analysis */}
      <div style={{ padding: '0 18px 16px' }}>
        <MonoLabel style={{ marginBottom: '12px' }}>Communication Analysis</MonoLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {scores.map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'Inter', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: '0.75rem', fontWeight: 500, color: s.color }}>{s.val}</span>
              </div>
              <div className="score-bar-track">
                <motion.div
                  style={{ height: '100%', borderRadius: '3px', background: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.val}%` }}
                  transition={{ duration: 1.1, delay: 0.5, ease }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--border)' }}>
        {[{ val: '142', lbl: 'WPM' }, { val: '8.7', lbl: 'Score' }, { val: '91%', lbl: 'Struct.' }, { val: '1.2%', lbl: 'Fillers' }].map((m, i) => (
          <div key={i} style={{ padding: '12px 10px', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: '0.575rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginTop: '4px' }}>{m.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const workflowSteps = [
  { step: '01', title: 'Role & Context Calibration', description: 'Calibrates question depth, domain vocabulary, and evaluation criteria to your specific role and seniority.' },
  { step: '02', title: 'Adaptive Communication Analysis', description: 'Real-time assessment of speech clarity, structural logic, pacing, and semantic confidence.' },
  { step: '03', title: 'Executive Performance Intelligence', description: 'Quantified breakdown across eight communication dimensions with precise improvement trajectories.' },
]

const capabilities = [
  { title: 'Behavioral Telemetry', desc: 'Eye contact ratio, head pose stability, and engagement patterns from live session data.', badge: 'Behavioral', color: 'var(--accent)' },
  { title: 'Resume Intelligence', desc: 'CV-grounded question generation. Every question derived from your actual curriculum vitae.', badge: 'Resume AI', color: 'var(--gold)' },
  { title: 'Semantic Evaluation', desc: 'Deep linguistic scoring across clarity, structure, confidence markers, and domain accuracy.', badge: 'NLP Engine', color: 'var(--accent)' },
  { title: 'Executive Reports', desc: 'PDF dossiers with longitudinal performance tracking, skill gaps, and growth trajectories.', badge: 'Reports', color: 'var(--gold)' },
]

export default function Home() {
  const { userData } = useSelector(s => s.user)
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  const start    = () => { if (!userData) { setShowAuth(true); return }; navigate('/interview') }
  const toAnalyt = () => { if (!userData) { setShowAuth(true); return }; navigate('/history') }

  return (
    <div className="page-container">
      <Navbar />
      <main style={{ flex: 1 }}>

        {/* ── HERO ── */}
        <section style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="content-width" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center',
            paddingTop: '88px',
            paddingBottom: '96px',
          }}>
            {/* Left copy */}
            <div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '4px 12px 4px 8px', borderRadius: '99px',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                  marginBottom: '32px',
                }}>
                  <div className="status-dot live" />
                  <MonoLabel style={{ display: 'inline', fontSize: '0.6rem', color: 'var(--accent)' }}>
                    Executive Communication Intelligence
                  </MonoLabel>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: 0.07, ease }}
                style={{
                  fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800,
                  fontSize: 'clamp(2.4rem, 4.2vw, 3.75rem)',
                  letterSpacing: '-0.04em', lineHeight: 1.08,
                  color: 'var(--text-primary)', marginBottom: '22px',
                }}
              >
                Communication<br />
                intelligence,<br />
                <span style={{ color: 'var(--accent)' }}>systematized.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.14, ease }}
                style={{
                  fontSize: '1.0625rem', color: 'var(--text-secondary)',
                  lineHeight: 1.75, maxWidth: '420px', marginBottom: '36px',
                }}
              >
                AIRA analyzes clarity, behavioral signals, and semantic structure in real time — producing intelligence-grade assessments trusted by enterprise hiring teams.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2, ease }}
                style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '40px' }}
              >
                <button id="hero-start-btn" className="btn-primary" style={{ padding: '11px 24px', fontSize: '0.9375rem' }} onClick={start}>
                  Begin session
                </button>
                <button id="hero-analytics-btn" className="btn-ghost" style={{ padding: '11px 20px', fontSize: '0.9375rem' }} onClick={toAnalyt}>
                  View analytics
                </button>
              </motion.div>

              {/* Trust signals */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.28, ease }}
                style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}
              >
                {['Real-time analysis', 'Behavioral telemetry', 'Executive PDF reports'].map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, opacity: 0.65 }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'Inter' }}>{label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — workspace */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.10, ease }}
            >
              <IntelligenceWorkspace />
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="content-width" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
            <Reveal>
              <div style={{ marginBottom: '52px' }}>
                <MonoLabel style={{ marginBottom: '12px' }}>Workflow</MonoLabel>
                <h2 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 3vw, 2.375rem)', letterSpacing: '-0.035em', color: 'var(--text-primary)', maxWidth: '500px' }}>
                  Precision engineered for<br />high-performance environments
                </h2>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 72px' }}>
              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {workflowSteps.map((f, i) => (
                  <Reveal key={i} delay={i * 0.06}>
                    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: '0', paddingBottom: '28px', marginBottom: '28px', borderBottom: '1px solid var(--border)' }}>
                      <MonoLabel style={{ display: 'inline', paddingTop: '3px', color: 'var(--accent)', fontSize: '0.6875rem' }}>{f.step}</MonoLabel>
                      <div>
                        <h3 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '7px' }}>{f.title}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Session telemetry panel */}
              <div style={{ alignSelf: 'start', paddingTop: '2px' }}>
                <Reveal delay={0.06}>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
                    <MonoLabel style={{ marginBottom: '20px' }}>Session Telemetry</MonoLabel>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {[
                        { label: 'Response Quality', val: '91', unit: '/100', color: 'var(--accent)' },
                        { label: 'Vocabulary Range', val: '847', unit: ' terms', color: 'var(--text-primary)' },
                        { label: 'Speaking Pace',   val: '142', unit: ' wpm',   color: 'var(--text-primary)' },
                        { label: 'Filler Words',    val: '1.2', unit: '%',      color: 'var(--gold)' },
                      ].map((m, i) => (
                        <div key={m.label} className="dossier-row">
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{m.label}</span>
                          <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: '0.9375rem', fontWeight: 500, color: m.color }}>
                            {m.val}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.unit}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── CAPABILITIES ── */}
        <section style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="content-width" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
            <Reveal>
              <div style={{ marginBottom: '48px' }}>
                <MonoLabel style={{ marginBottom: '12px' }}>Platform Intelligence</MonoLabel>
                <h2 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 3vw, 2.375rem)', letterSpacing: '-0.035em', color: 'var(--text-primary)', maxWidth: '480px' }}>
                  Built for organizations that take communication seriously
                </h2>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {capabilities.map((c, i) => (
                <Reveal key={i} delay={i * 0.06}>
                  <div
                    className="intel-card"
                    style={{ padding: '24px', height: '100%', cursor: 'default' }}
                  >
                    <div style={{ width: '24px', height: '2px', background: c.color, borderRadius: '2px', marginBottom: '16px', opacity: 0.8 }} />
                    <div style={{ marginBottom: '10px' }}>
                      <span className="badge badge-neutral">{c.badge}</span>
                    </div>
                    <h3 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '8px' }}>{c.title}</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section>
          <div className="content-width" style={{ paddingTop: '80px', paddingBottom: '88px' }}>
            <Reveal>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-strong)',
                borderRadius: '20px',
                padding: '52px 48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '48px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Top accent rule */}
                <div style={{ position: 'absolute', top: 0, left: '24px', right: '24px', height: '1.5px', background: 'linear-gradient(90deg, var(--accent) 0%, transparent 70%)' }} />

                <div style={{ flex: 1, maxWidth: '480px' }}>
                  <MonoLabel style={{ marginBottom: '14px' }}>Get started</MonoLabel>
                  <h2 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 2.5vw, 2.125rem)', letterSpacing: '-0.035em', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Ready to operate at the<br />executive level?
                  </h2>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    Start your first intelligence session. Your first 100 credits are complimentary — no setup required.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                  <button id="cta-start-btn" className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.9375rem' }} onClick={start}>
                    Begin session
                  </button>
                  <button id="cta-pricing-btn" className="btn-ghost" style={{ padding: '12px 24px', fontSize: '0.875rem' }} onClick={() => navigate('/pricing')}>
                    View pricing
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  )
}
