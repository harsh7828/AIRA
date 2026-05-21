import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import jsPDF from 'jspdf'

const ease = [0.22, 1, 0.36, 1]

const Mono = ({ children, style }) => (
  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', ...style }}>
    {children}
  </span>
)

const SegBar = ({ value, max = 10, color = 'var(--accent)' }) => (
  <div style={{ display: 'flex', gap: '2px', height: '3px', width: '100%' }}>
    {Array.from({ length: max }).map((_, i) => (
      <div key={i} style={{ flex: 1, borderRadius: '2px', background: i < value ? color : 'var(--border)', transition: 'background 300ms' }} />
    ))}
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '9px', padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
      <Mono style={{ marginBottom: '4px' }}>{label}</Mono>
      <span style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--accent)' }}>{payload[0].value}/10</span>
    </div>
  )
}

function Step3Report({ report }) {
  const navigate = useNavigate()

  if (!report) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Mono>Loading Report…</Mono>
      </div>
    )
  }

  const { finalScore = 0, confidence = 0, communication = 0, correctness = 0, questionWiseScore = [], behavioralData = null } = report

  const chartData = questionWiseScore.map((q, i) => ({ name: `Q${i + 1}`, score: q.score || 0 }))

  const performanceText = finalScore >= 8 ? 'Ready for opportunities.' : finalScore >= 5 ? 'Needs minor refinement.' : 'Significant improvement required.'
  const shortTagline = finalScore >= 8 ? 'Excellent clarity and structured responses.' : finalScore >= 5 ? 'Good foundation — refine articulation.' : 'Work on clarity and confidence.'
  const scoreColor = finalScore >= 8 ? 'var(--accent)' : finalScore >= 5 ? 'var(--secondary)' : 'var(--danger)'

  const downloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const W = doc.internal.pageSize.getWidth()
    const H = doc.internal.pageSize.getHeight()
    const M = 18
    const CW = W - M * 2

    // ── Color palette ──────────────────────────────────────────────
    const emerald = [34, 197, 94]
    const emeraldDark = [21, 128, 61]
    const gold = [212, 169, 106]
    const danger = [248, 113, 113]
    const dark = [10, 10, 10]
    const surface = [20, 20, 20]
    const card = [28, 28, 28]
    const border = [45, 45, 45]
    const textPrimary = [245, 245, 245]
    const textSecondary = [163, 163, 163]
    const textMuted = [115, 115, 115]

    const scoreRGB = finalScore >= 8 ? emerald : finalScore >= 5 ? gold : danger

    // ── Helpers ────────────────────────────────────────────────────
    const addPageBg = () => {
      doc.setFillColor(...dark)
      doc.rect(0, 0, W, H, 'F')
    }

    const sectionLabel = (text, x, y) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...textMuted)
      doc.text(text.toUpperCase(), x, y)
    }

    const drawBar = (x, y, w, h, pct, rgb) => {
      // Track
      doc.setFillColor(...border)
      doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F')
      // Fill
      const fillW = Math.max(0, Math.min(w, w * (pct / 100)))
      if (fillW > 0) {
        doc.setFillColor(...rgb)
        doc.roundedRect(x, y, fillW, h, h / 2, h / 2, 'F')
      }
    }

    const drawCard = (x, y, w, h) => {
      doc.setFillColor(...card)
      doc.roundedRect(x, y, w, h, 4, 4, 'F')
      doc.setDrawColor(...border)
      doc.setLineWidth(0.3)
      doc.roundedRect(x, y, w, h, 4, 4, 'S')
    }

    const addPageFooter = (pageNum) => {
      doc.setFont('courier', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...textMuted)
      doc.text('AIRA — AI Communication Intelligence Platform', M, H - 8)
      doc.text(`Page ${pageNum}`, W - M, H - 8, { align: 'right' })
      doc.setDrawColor(...border)
      doc.setLineWidth(0.3)
      doc.line(M, H - 12, W - M, H - 12)
    }

    const wrappedText = (text, x, y, maxW, lineH, color, fontSize) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(fontSize || 9)
      doc.setTextColor(...(color || textSecondary))
      const lines = doc.splitTextToSize(text || '', maxW)
      doc.text(lines, x, y)
      return lines.length * lineH
    }

    // ══════════════════════════════════════════════════════════════
    // PAGE 1 — COVER + SUMMARY
    // ══════════════════════════════════════════════════════════════
    addPageBg()

    // Header banner
    doc.setFillColor(...surface)
    doc.roundedRect(0, 0, W, 38, 0, 0, 'F')
    doc.setDrawColor(...emeraldDark)
    doc.setLineWidth(0.8)
    doc.line(0, 38, W, 38)

    // Logo area
    doc.setFont('courier', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...emerald)
    doc.text('AIRA', M, 16)
    doc.setFont('courier', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...textMuted)
    doc.text('AI COMMUNICATION INTELLIGENCE', M, 23)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, W - M, 23, { align: 'right' })

    // Report title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(...textPrimary)
    doc.text('Executive Performance Dossier', M, 56)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...textSecondary)
    doc.text('AI-Powered Communication & Behavioral Assessment Report', M, 64)

    // Accent line under title
    doc.setDrawColor(...emerald)
    doc.setLineWidth(1.5)
    doc.line(M, 68, M + 60, 68)

    // ── Overall Score Card ─────────────────────────────────────────
    const scoreCardY = 78
    drawCard(M, scoreCardY, CW, 42)

    // Score number
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(36)
    doc.setTextColor(...scoreRGB)
    doc.text(`${finalScore}`, M + 14, scoreCardY + 26)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(...textMuted)
    doc.text('/10', M + 28, scoreCardY + 26)

    // Vertical separator
    doc.setDrawColor(...border)
    doc.setLineWidth(0.5)
    doc.line(M + 52, scoreCardY + 8, M + 52, scoreCardY + 34)

    // Performance text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...textPrimary)
    doc.text(performanceText, M + 60, scoreCardY + 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...textSecondary)
    const taglines = doc.splitTextToSize(shortTagline, CW - 68)
    doc.text(taglines, M + 60, scoreCardY + 25)

    // Score bar
    drawBar(M + 8, scoreCardY + 36, CW - 16, 3, finalScore * 10, scoreRGB)

    // ── 3 Skill Metrics Cards ──────────────────────────────────────
    const metricsY = scoreCardY + 52
    const metrics3 = [
      { label: 'Confidence', value: confidence, pct: confidence * 10 },
      { label: 'Communication', value: communication, pct: communication * 10 },
      { label: 'Correctness', value: correctness, pct: correctness * 10 },
    ]
    const mCardW = (CW - 8) / 3

    metrics3.forEach((m, i) => {
      const mx = M + i * (mCardW + 4)
      const mColor = m.value >= 8 ? emerald : m.value >= 5 ? gold : danger
      drawCard(mx, metricsY, mCardW, 34)
      sectionLabel(m.label, mx + 8, metricsY + 10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...mColor)
      doc.text(`${m.value}`, mx + 8, metricsY + 22)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...textMuted)
      doc.text('/10', mx + 16, metricsY + 22)
      drawBar(mx + 8, metricsY + 28, mCardW - 16, 3, m.pct, mColor)
    })

    // ── Behavioral Telemetry Card ─────────────────────────────────
    if (behavioralData) {
      const behavY = metricsY + 44
      drawCard(M, behavY, CW, 62)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...emerald)
      doc.text('BEHAVIORAL TELEMETRY', M + 8, behavY + 10)

      const eyePct = Math.round(behavioralData.overallEyeContact * 100)
      const stabPct = Math.round(behavioralData.overallStability * 100)
      const focusRatio = 1 - (behavioralData.totalDistractionTime / Math.max(behavioralData.totalDuration, 1))
      const focusPct = Math.round(focusRatio * 100)
      const engLevel = behavioralData.engagementLevel || 'Low'
      const engPct = engLevel === 'High' ? 92 : engLevel === 'Medium' ? 68 : 40

      const bMetrics = [
        { label: 'Eye Contact', pct: eyePct },
        { label: 'Composure / Stability', pct: stabPct },
        { label: 'Focus Time', pct: focusPct },
        { label: 'Engagement Level', pct: engPct },
      ]

      const bColW = (CW - 16) / 2
      bMetrics.forEach((bm, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const bx = M + 8 + col * (bColW + 4)
        const by = behavY + 18 + row * 18
        const bColor = bm.pct >= 70 ? emerald : bm.pct >= 45 ? gold : danger
        sectionLabel(bm.label, bx, by)
        doc.setFont('courier', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...bColor)
        doc.text(`${bm.pct}%`, bx + bColW - 20, by)
        drawBar(bx, by + 3, bColW - 24, 3, bm.pct, bColor)
      })

      // Nod / distraction stats
      doc.setFont('courier', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...textMuted)
      const statsY = behavY + 56
      const totalSec = Math.round(behavioralData.totalDuration || 0)
      const disSec = Math.round(behavioralData.totalDistractionTime || 0)
      const nods = behavioralData.activeListeningNods || 0
      doc.text(`Session Duration: ${Math.floor(totalSec / 60)}m ${totalSec % 60}s   |   Distraction: ${disSec}s   |   Active Nods: ${nods}`, M + 8, statsY)
    }

    addPageFooter(1)

    // ══════════════════════════════════════════════════════════════
    // PAGE 2 — QUESTION-BY-QUESTION BREAKDOWN
    // ══════════════════════════════════════════════════════════════
    doc.addPage()
    addPageBg()

    // Section header
    doc.setFillColor(...surface)
    doc.rect(0, 0, W, 22, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...textPrimary)
    doc.text('Question-by-Question Breakdown', M, 14)
    doc.setFont('courier', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...textMuted)
    doc.text('Detailed scoring and AI-generated feedback per question', W - M, 14, { align: 'right' })

    let qY = 32

    questionWiseScore.forEach((q, i) => {
      const qScore = q.score ?? 0
      const qColor = qScore >= 8 ? emerald : qScore >= 5 ? gold : danger
      const questionText = q.question || 'Question not available'
      const feedbackText = q.feedback?.trim() || 'No feedback available.'

      // Estimate card height
      const qLines = doc.splitTextToSize(questionText, CW - 36)
      const fLines = doc.splitTextToSize(feedbackText, CW - 36)
      const cardH = 14 + qLines.length * 5.5 + 8 + fLines.length * 5 + 10

      // Page break if needed
      if (qY + cardH > H - 20) {
        addPageFooter(doc.getNumberOfPages())
        doc.addPage()
        addPageBg()
        doc.setFillColor(...surface)
        doc.rect(0, 0, W, 22, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(...textPrimary)
        doc.text('Question Breakdown (continued)', M, 14)
        qY = 32
      }

      drawCard(M, qY, CW, cardH)

      // Score badge
      doc.setFillColor(...qColor, 25)
      doc.roundedRect(M + CW - 24, qY + 6, 18, 12, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...qColor)
      doc.text(`${qScore}`, M + CW - 19, qY + 15, { align: 'center' })
      doc.setFont('courier', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...textMuted)
      doc.text('/10', M + CW - 12, qY + 15)

      // Question label
      doc.setFont('courier', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...emerald)
      doc.text(`Q${i + 1}`, M + 8, qY + 10)

      // Question text
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...textPrimary)
      const qWrapped = doc.splitTextToSize(questionText, CW - 36)
      doc.text(qWrapped, M + 15, qY + 10)

      // Separator
      const sepY = qY + 10 + qLines.length * 5.5 + 4
      doc.setDrawColor(...border)
      doc.setLineWidth(0.3)
      doc.line(M + 8, sepY, M + CW - 8, sepY)

      // Left accent bar for feedback
      doc.setFillColor(...qColor)
      doc.rect(M + 8, sepY + 4, 2, fLines.length * 5, 'F')

      // Feedback text
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...textSecondary)
      doc.text(fLines, M + 14, sepY + 9)

      qY += cardH + 8
    })

    addPageFooter(doc.getNumberOfPages())

    // ══════════════════════════════════════════════════════════════
    // PAGE 3 — BEHAVIORAL OBSERVATIONS + SUMMARY
    // ══════════════════════════════════════════════════════════════
    if (behavioralData) {
      doc.addPage()
      addPageBg()

      doc.setFillColor(...surface)
      doc.rect(0, 0, W, 22, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(...textPrimary)
      doc.text('Behavioral Intelligence Report', M, 14)

      let oY = 32

      // Observations
      const observations = [
        {
          label: 'Eye Contact',
          pct: Math.round(behavioralData.overallEyeContact * 100),
          threshold: 70,
          good: 'Strong eye contact maintained — projected confidence and engagement throughout.',
          moderate: 'Moderate eye contact — consider maintaining more consistent camera focus.',
          low: 'Low eye contact detected — practice looking directly at the camera to build presence.',
        },
        {
          label: 'Composure & Stability',
          pct: Math.round(behavioralData.overallStability * 100),
          threshold: 70,
          good: 'Excellent composure — calm and collected demeanor conveyed professionalism.',
          moderate: 'Some movement detected — work on maintaining a stable, confident posture.',
          low: 'Significant movement — practice stillness to project composure during interviews.',
        },
        {
          label: 'Focus & Attention',
          pct: Math.round((1 - behavioralData.totalDistractionTime / Math.max(behavioralData.totalDuration, 1)) * 100),
          threshold: 80,
          good: 'Highly focused — minimal distractions throughout the session.',
          moderate: 'Occasional distractions — minimize environmental interruptions.',
          low: 'Frequent distractions — create a focused, distraction-free interview environment.',
        },
      ]

      sectionLabel('BEHAVIORAL OBSERVATIONS', M, oY)
      oY += 8

      observations.forEach(obs => {
        const color = obs.pct >= obs.threshold ? emerald : obs.pct >= obs.threshold * 0.6 ? gold : danger
        const text = obs.pct >= obs.threshold ? obs.good : obs.pct >= obs.threshold * 0.6 ? obs.moderate : obs.low
        const textLines = doc.splitTextToSize(text, CW - 44)
        const cardH = textLines.length * 5.5 + 22

        drawCard(M, oY, CW, cardH)
        doc.setFillColor(...color)
        doc.rect(M, oY, 3, cardH, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(...textPrimary)
        doc.text(obs.label, M + 10, oY + 10)

        doc.setFont('courier', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...color)
        doc.text(`${obs.pct}%`, M + CW - 16, oY + 10, { align: 'right' })

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...textSecondary)
        doc.text(textLines, M + 10, oY + 18)

        oY += cardH + 6
      })

      // Final recommendation card
      oY += 4
      const recText = finalScore >= 8
        ? 'Outstanding performance. This candidate demonstrates strong communication skills, confident presence, and structured responses. Ready for high-stakes interview scenarios.'
        : finalScore >= 5
          ? 'Solid foundation with room for refinement. Focus on structuring responses with clearer context-action-outcome flow and maintaining consistent eye contact for stronger impact.'
          : 'Significant development needed. Prioritize building response frameworks (STAR method), improving eye contact, and practicing concise articulation under time constraints.'

      const recLines = doc.splitTextToSize(recText, CW - 24)
      const recH = recLines.length * 5.5 + 24
      drawCard(M, oY, CW, recH)

      // Green top stripe
      doc.setFillColor(...emerald)
      doc.roundedRect(M, oY, CW, 3, 2, 2, 'F')

      doc.setFont('courier', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...emerald)
      doc.text('AIRA RECOMMENDATION', M + 8, oY + 12)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...textSecondary)
      doc.text(recLines, M + 8, oY + 20)

      addPageFooter(doc.getNumberOfPages())
    }

    doc.save('AIRA_Executive_Dossier.pdf')
  }

  const panelStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '18px', padding: '28px' }

  return (
    <div style={{ minHeight: '100vh', padding: '48px 32px 96px', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => navigate('/history')}
              style={{ width: '34px', height: '34px', borderRadius: '9px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 120ms' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div>
              <h1 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '4px' }}>
                Executive Performance Dossier
              </h1>
              <Mono>AI-Powered Communication Assessment</Mono>
            </div>
          </div>
          <button id="download-pdf-btn" onClick={downloadPDF} className="btn-ghost" style={{ padding: '9px 18px', flexShrink: 0 }}>
            Download PDF
          </button>
        </div>

        {/* Top row: Score + Skills + Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>

          {/* Overall score */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...panelStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${scoreColor} 0%, transparent 70%)` }} />
            <Mono style={{ marginBottom: '16px' }}>Overall Rating</Mono>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '4.5rem', color: scoreColor, letterSpacing: '-0.05em', lineHeight: 1 }}>{finalScore}</span>
              <span style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 600, fontSize: '1.5rem', color: 'var(--text-muted)' }}>/10</span>
            </div>
            <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{performanceText}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{shortTagline}</p>
          </motion.div>

          {/* Skills breakdown */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} style={panelStyle}>
            <Mono style={{ marginBottom: '20px' }}>Communication Skills</Mono>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {[{ label: 'Confidence', value: confidence }, { label: 'Communication', value: communication }, { label: 'Correctness', value: correctness }].map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>{s.label}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{s.value}/10</span>
                  </div>
                  <SegBar value={s.value} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Performance trend */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} style={panelStyle}>
            <Mono style={{ marginBottom: '16px' }}>Performance Trend</Mono>
            <div style={{ height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: "'IBM Plex Mono'" }} dy={8} />
                  <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: "'IBM Plex Mono'" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="var(--accent)" fill="url(#areaGrad)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3, strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Bottom row: Q breakdown + Behavioral */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '14px' }}>

          {/* Question breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Mono style={{ padding: '0 4px', marginBottom: '4px' }}>Detailed Feedback</Mono>
            {questionWiseScore.map((q, i) => {
              const qColor = q.score >= 8 ? 'var(--accent)' : q.score >= 5 ? 'var(--gold)' : 'var(--danger)'
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07, ease }}
                  style={{ ...panelStyle, padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
                    <div style={{ flex: 1 }}>
                      <Mono style={{ color: 'var(--accent)', marginBottom: '8px' }}>Question {i + 1}</Mono>
                      <p style={{ fontFamily: 'Inter', fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.55, fontWeight: 500 }}>{q.question || 'Question not available'}</p>
                    </div>
                    <div style={{ flexShrink: 0, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '9px', padding: '7px 13px', textAlign: 'center' }}>
                      <span style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '1.125rem', color: qColor, letterSpacing: '-0.03em' }}>{q.score ?? 0}</span>
                      <Mono style={{ fontSize: '0.575rem', marginTop: '1px' }}>/10</Mono>
                    </div>
                  </div>
                  <div style={{ paddingLeft: '14px', borderLeft: '2px solid var(--border)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: 'Inter' }}>
                      {q.feedback?.trim() || 'No feedback available.'}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Behavioral */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Mono style={{ padding: '0 4px', marginBottom: '4px' }}>Telemetry Insights</Mono>

            {behavioralData ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ ...panelStyle, display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {[
                  { label: 'Eye Contact', value: Math.round(behavioralData.overallEyeContact * 10), pct: Math.round(behavioralData.overallEyeContact * 100) },
                  { label: 'Composure', value: Math.round(behavioralData.overallStability * 10), pct: Math.round(behavioralData.overallStability * 100) },
                  {
                    label: 'Focus Time',
                    value: Math.round((1 - behavioralData.totalDistractionTime / Math.max(behavioralData.totalDuration, 1)) * 10),
                    pct: Math.round((1 - behavioralData.totalDistractionTime / Math.max(behavioralData.totalDuration, 1)) * 100)
                  },
                ].map(m => {
                  const c = m.value >= 7 ? 'var(--accent)' : m.value >= 4 ? 'var(--gold)' : 'var(--danger)'
                  return (
                    <div key={m.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'Inter' }}>{m.label}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: '0.8125rem', color: c }}>{m.pct}%</span>
                      </div>
                      <SegBar value={m.value} color={c} />
                    </div>
                  )
                })}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <Mono style={{ marginBottom: '14px' }}>Observations</Mono>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      {
                        ok: behavioralData.overallEyeContact >= 0.7,
                        good: 'Strong eye contact — demonstrated confidence and engagement.',
                        warn: behavioralData.overallEyeContact >= 0.4 ? 'Moderate eye contact — improve camera focus.' : 'Low eye contact — practice maintaining focus.',
                        borderColor: behavioralData.overallEyeContact >= 0.7 ? 'var(--accent)' : behavioralData.overallEyeContact >= 0.4 ? 'var(--gold)' : 'var(--danger)',
                      },
                      {
                        ok: behavioralData.overallStability >= 0.7,
                        good: 'Steady composure — calm and collected demeanor.',
                        warn: 'Some movement — maintain a more stable posture.',
                        borderColor: behavioralData.overallStability >= 0.7 ? 'var(--accent)' : 'var(--gold)',
                      },
                    ].map((obs, i) => (
                      <div key={i} style={{ paddingLeft: '12px', borderLeft: `2px solid ${obs.borderColor}` }}>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'Inter' }}>
                          {obs.ok ? obs.good : obs.warn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ ...panelStyle, textAlign: 'center', border: '1px dashed var(--border-strong)' }}>
                <Mono style={{ marginBottom: '12px' }}>Telemetry Offline</Mono>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'Inter', lineHeight: 1.6 }}>
                  Enable webcam access to receive behavioral insights.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step3Report
