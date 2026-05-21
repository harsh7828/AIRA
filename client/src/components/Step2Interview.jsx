import React, { useState, useRef, useCallback, useEffect } from 'react'
import maleVideo from "../assets/videos/male-ai.mp4"
import femaleVideo from "../assets/videos/female-ai.mp4"
import { motion } from "framer-motion"
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa"
import axios from "axios"
import { ServerUrl } from '../App'
import { BsArrowRight } from 'react-icons/bs'
import Editor from "@monaco-editor/react"
import { PrismTracker } from '../utils/prismEngine'

const C = {
  bg: '#040404',
  bg2: '#0A0A0A',
  surface: '#111111',
  elevated: '#171717',
  card: '#1C1C1C',
  panel: '#202020',
  text: '#F5F5F5',
  text2: '#A3A3A3',
  muted: '#737373',
  faint: '#525252',
  border: 'rgba(255,255,255,0.05)',
  borderHi: 'rgba(255,255,255,0.09)',
  emerald: '#39FF14',
  emeraldMuted: '#22C55E',
  emeraldDeep: '#15803D',
  emeraldSoft: 'rgba(57,255,20,0.12)',
  emeraldFaint: 'rgba(57,255,20,0.055)',
  highlight: '#86EFAC',
  gold: '#D4A96A',
  danger: '#F87171',
}

const waveformHeights = [8, 18, 12, 27, 16, 34, 10, 24, 30, 14, 22, 36, 18, 26, 12, 32, 20, 10, 28, 15, 24, 34, 12, 18]
const fillerWords = ['um', 'uh', 'like', 'actually', 'basically', 'literally', 'honestly', 'you know', 'kind of', 'sort of']

const Label = ({ children, style }) => (
  <span
    style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '0.625rem',
      fontWeight: 500,
      letterSpacing: 0,
      color: C.muted,
      ...style,
    }}
  >
    {children}
  </span>
)

const Section = ({ title, children, style }) => (
  <section style={{ padding: '15px 16px', borderBottom: `1px solid ${C.border}`, ...style }}>
    <Label style={{ display: 'block', marginBottom: 10 }}>{title}</Label>
    {children}
  </section>
)

const Pill = ({ label, value, tone = 'neutral' }) => {
  const toneColor = tone === 'good' ? C.emeraldMuted : tone === 'warn' ? C.gold : C.text2

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 30,
        padding: '6px 10px',
        background: C.elevated,
        border: `1px solid ${tone === 'good' ? 'rgba(57,255,20,0.13)' : C.border}`,
        borderRadius: 8,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <Label>{label}</Label>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', fontWeight: 500, color: toneColor }}>{value}</span>
    </div>
  )
}

const MetricRow = ({ label, value, qualifier, pct, tone = 'neutral' }) => {
  const signalColor = tone === 'good' ? C.emeraldMuted : tone === 'warn' ? C.gold : tone === 'bad' ? C.danger : C.text2

  return (
    <div style={{ padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: '0.8125rem', color: C.text2 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: C.text, fontWeight: 500 }}>{value}</span>
          {qualifier && <Label style={{ color: signalColor }}>{qualifier}</Label>}
        </div>
      </div>
      {typeof pct === 'number' && (
        <div style={{ height: 3, marginTop: 8, background: 'rgba(255,255,255,0.045)', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.max(0, Math.min(100, pct))}%`,
              height: '100%',
              background: signalColor,
              borderRadius: 2,
              boxShadow: tone === 'good' ? `0 0 10px ${C.emeraldSoft}` : 'none',
              transition: 'width 500ms ease',
            }}
          />
        </div>
      )}
    </div>
  )
}

const SegBar = ({ total, index }) => (
  <div style={{ display: 'flex', gap: 3, width: '100%', height: 4 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        style={{
          flex: 1,
          borderRadius: 2,
          background: i < index ? C.emeraldDeep : i === index ? C.emeraldMuted : 'rgba(255,255,255,0.055)',
          opacity: i === index ? 0.95 : 0.72,
          transition: 'background 280ms ease',
        }}
      />
    ))}
  </div>
)

const Waveform = ({ active }) => (
  <div
    aria-hidden="true"
    style={{
      height: 54,
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      padding: '0 2px',
      overflow: 'hidden',
    }}
  >
    {waveformHeights.map((height, i) => (
      <span
        key={i}
        className={active ? 'waveform-bar' : undefined}
        style={{
          width: 3,
          height,
          borderRadius: 2,
          background: active ? C.emeraldMuted : 'rgba(255,255,255,0.14)',
          opacity: active ? 0.75 : 0.34,
          animationDelay: `${i * 0.045}s`,
          boxShadow: active && i % 5 === 0 ? `0 0 12px ${C.emeraldSoft}` : 'none',
        }}
      />
    ))}
  </div>
)

const Gauge = ({ label, value, sublabel }) => {
  const safeValue = Math.max(0, Math.min(100, value || 0))

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: '50%',
          background: `conic-gradient(${C.emeraldMuted} ${safeValue * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
          padding: 1,
          boxShadow: safeValue ? `0 0 18px ${C.emeraldFaint}` : 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: C.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${C.border}`,
          }}
        >
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text, fontSize: '1rem', fontWeight: 600 }}>{safeValue || '--'}</span>
        </div>
      </div>
      <div>
        <Label style={{ display: 'block', marginBottom: 4 }}>{label}</Label>
        <p style={{ color: C.text2, fontSize: '0.8125rem', lineHeight: 1.5 }}>{sublabel}</p>
      </div>
    </div>
  )
}

const InsightBlock = ({ title, children }) => (
  <div style={{ padding: '15px 16px', borderBottom: `1px solid ${C.border}` }}>
    <Label style={{ display: 'block', marginBottom: 12 }}>{title}</Label>
    {children}
  </div>
)

const StructureItem = ({ label, active }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minHeight: 28 }}>
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: active ? C.emeraldMuted : 'rgba(255,255,255,0.12)',
        boxShadow: active ? `0 0 8px ${C.emeraldSoft}` : 'none',
        flex: '0 0 auto',
      }}
    />
    <span style={{ color: active ? C.text : C.muted, fontSize: '0.8125rem' }}>{label}</span>
  </div>
)

const fmtTime = s => {
  const safe = Math.max(0, s || 0)
  const m = Math.floor(safe / 60)
  return `${String(m).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

function Step2Interview({ interviewData, onFinish }) {
  const { interviewId, questions, userName } = interviewData
  const [localQ, setLocalQ] = useState(questions)
  const [intro, setIntro] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const mrRef = useRef(null), chunksRef = useRef([])
  const [blob, setBlob] = useState(null)
  const [aiPlaying, setAiPlaying] = useState(false)
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState('')
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60)
  const [voice, setVoice] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [gender, setGender] = useState('female')
  const [subtitle, setSubtitle] = useState('')
  const [metrics, setMetrics] = useState({ eyeContactRatio: 0, headPoseStability: 1, engagementLevel: 'Low', faceDetected: false })
  const [prismOn, setPrismOn] = useState(false)
  const [calibPct, setCalibPct] = useState(0)
  const [calibDone, setCalibDone] = useState(false)
  const vidRef = useRef(null), camRef = useRef(null), prismRef = useRef(null), streamRef = useRef(null)
  const curQ = localQ[idx]

  const initPrism = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } })
      streamRef.current = s
      if (camRef.current) {
        camRef.current.srcObject = s
        camRef.current.muted = true
        camRef.current.playsInline = true
        await camRef.current.play()
        prismRef.current = new PrismTracker(camRef.current, { onMetricsUpdate: m => setMetrics(m) })
        await prismRef.current.start()
        setPrismOn(true)
        const ok = await prismRef.current.calibrate(p => setCalibPct(p))
        if (ok) setCalibDone(true)
      }
    } catch {
      setPrismOn(false)
    }
  }, [])

  const cleanPrism = useCallback(() => {
    prismRef.current?.stop()
    prismRef.current?.dispose()
    prismRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setPrismOn(false)
  }, [])

  useEffect(() => { initPrism(); return cleanPrism }, [initPrism, cleanPrism])
  useEffect(() => { if (prismRef.current && !intro) prismRef.current.setQuestionIndex(idx) }, [idx, intro])
  useEffect(() => { prismRef.current?.setAIPlayingState(aiPlaying) }, [aiPlaying])

  useEffect(() => {
    const load = () => {
      const vv = window.speechSynthesis.getVoices()
      if (!vv.length) return
      const f = vv.find(v => v.lang.toLowerCase() === 'en-in') || vv.find(v => /samantha|zira|female/i.test(v.name)) || vv[0]
      setVoice(f)
      setGender(/male/i.test(f?.name) ? 'male' : 'female')
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
  }, [])

  const stopMic = () => {
    if (mrRef.current?.state === 'recording') {
      mrRef.current.stop()
      mrRef.current.stream.getTracks().forEach(t => t.stop())
    }
  }

  const startMic = async () => {
    if (aiPlaying || intro) return
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(s)
      mrRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => setBlob(new Blob(chunksRef.current, { type: 'audio/webm' }))
      mr.start()
    } catch {}
  }

  const speak = async text => new Promise(async resolve => {
    try {
      const r = await axios.post(ServerUrl + '/api/interview/tts', { text, gender }, { withCredentials: true, responseType: 'blob' })
      const a = new Audio(URL.createObjectURL(r.data))
      setAiPlaying(true)
      stopMic()
      vidRef.current?.play()
      setSubtitle(text)
      a.onended = () => {
        if (vidRef.current) {
          vidRef.current.pause()
          vidRef.current.currentTime = 0
        }
        setAiPlaying(false)
        if (micOn) startMic()
        setTimeout(() => { setSubtitle(''); resolve() }, 300)
      }
      a.play().catch(() => {
        setAiPlaying(false)
        if (vidRef.current) vidRef.current.pause()
        setSubtitle('')
        resolve()
      })
    } catch {
      if (!window.speechSynthesis || !voice) { resolve(); return }
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.voice = voice
      u.rate = 0.92
      u.pitch = 1.05
      u.onstart = () => { setAiPlaying(true); stopMic(); vidRef.current?.play(); setSubtitle(text) }
      u.onend = () => {
        if (vidRef.current) {
          vidRef.current.pause()
          vidRef.current.currentTime = 0
        }
        setAiPlaying(false)
        if (micOn) startMic()
        setTimeout(() => { setSubtitle(''); resolve() }, 300)
      }
      window.speechSynthesis.speak(u)
    }
  })

  useEffect(() => {
    if (!voice) return
    ;(async () => {
      if (intro) {
        await speak(`Hi ${userName}, great to meet you. Let's begin.`)
        setIntro(false)
      } else if (curQ) {
        await new Promise(r => setTimeout(r, 700))
        await speak(curQ.question)
        if (micOn) startMic()
      }
    })()
  }, [voice, intro, idx])

  useEffect(() => {
    if (intro || !curQ) return
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) {
        clearInterval(t)
        return 0
      }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  }, [intro, idx])

  useEffect(() => { if (!intro && curQ) setTimeLeft(curQ.timeLimit || 60) }, [idx])
  useEffect(() => { if (!intro && curQ && timeLeft === 0 && !submitting && !feedback) submitAnswer() }, [timeLeft])

  const submitAnswer = async () => {
    if (submitting || intro) return
    setSubmitting(true)
    let b = blob
    if (mrRef.current?.state === 'recording') {
      b = await new Promise(res => {
        mrRef.current.onstop = () => {
          const x = new Blob(chunksRef.current, { type: 'audio/webm' })
          setBlob(x)
          res(x)
        }
        mrRef.current.stop()
        mrRef.current.stream.getTracks().forEach(t => t.stop())
      })
    }
    try {
      const fd = new FormData()
      fd.append('interviewId', interviewId)
      fd.append('questionIndex', idx)
      fd.append('timeTaken', curQ.timeLimit - timeLeft)
      if (b) fd.append('audio', b, 'answer.webm')
      if (answer) fd.append('answer', answer)
      const res = await axios.post(ServerUrl + '/api/interview/submit-answer', fd, { withCredentials: true })
      if (res.data.answer !== undefined) setAnswer(res.data.answer)
      if (res.data.transcription) setTranscript(res.data.transcription)
      setFeedback(res.data.feedback)
      if (res.data.nextQuestion && idx + 1 < localQ.length) {
        const u = [...localQ]
        u[idx + 1] = { ...u[idx + 1], question: res.data.nextQuestion }
        setLocalQ(u)
      }
      speak(res.data.feedback)
    } catch {}
    setSubmitting(false)
    setBlob(null)
  }

  const handleNext = async () => {
    setAnswer('')
    setTranscript('')
    setFeedback('')
    if (idx + 1 >= localQ.length) { finish(); return }
    await speak("Let's move to the next question.")
    setIdx(idx + 1)
    setTimeout(() => { if (micOn) startMic() }, 500)
  }

  const finish = async () => {
    stopMic()
    setMicOn(false)
    const pr = prismRef.current?.getSessionReport() ?? null
    try {
      const r = await axios.post(ServerUrl + '/api/interview/finish', {
        interviewId,
        behavioralData: pr,
        sentimentScore: pr?.sentimentScore || 0.5,
        activeListeningNods: pr?.activeListeningNods || 0,
        engagementLevel: pr?.engagementLevel || 'Low',
      }, { withCredentials: true })
      onFinish(r.data)
    } catch {}
  }

  useEffect(() => () => {
    if (mrRef.current?.state === 'recording') {
      mrRef.current.stop()
      mrRef.current.stream.getTracks().forEach(t => t.stop())
    }
    window.speechSynthesis.cancel()
  }, [])

  const eyePct = Math.round((metrics.eyeContactRatio || 0) * 100)
  const stabPct = Math.round((metrics.headPoseStability || 0) * 100)
  const engageLabel = metrics.engagementLevel || 'Low'
  const eyeQ = eyePct >= 80 ? 'Excellent' : eyePct >= 60 ? 'Good' : 'Low'
  const stabQ = stabPct >= 80 ? 'Stable' : stabPct >= 60 ? 'Measured' : 'Unstable'
  const analysisText = answer || transcript || ''
  const words = analysisText.trim() ? analysisText.trim().split(/\s+/).filter(Boolean).length : 0
  const sentenceCount = analysisText ? Math.max(1, (analysisText.match(/[.!?]+/g) || []).length) : 0
  const avgSentence = sentenceCount ? Math.round(words / sentenceCount) : 0
  const fillerCount = fillerWords.reduce((sum, word) => sum + ((analysisText.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length), 0)
  const fillerRate = words ? Math.round((fillerCount / words) * 100) : 0
  const elapsed = Math.max(1, (curQ?.timeLimit || 60) - timeLeft)
  const wpm = words ? Math.round((words / elapsed) * 60) : 0
  const paceLabel = !words ? 'Awaiting' : wpm < 95 ? 'Measured' : wpm <= 165 ? 'Optimal' : 'Fast'
  const engagementScore = engageLabel === 'High' ? 92 : engageLabel === 'Medium' ? 72 : engageLabel === 'Low' ? 42 : 60
  const confidenceScore = Math.round((eyePct * 0.42) + (stabPct * 0.34) + (engagementScore * 0.24))
  const structureSignals = [
    { label: 'Context', active: words > 18 || /\b(context|situation|challenge|goal|role|project)\b/i.test(analysisText) },
    { label: 'Action', active: /\b(i|we)\s+(built|led|handled|designed|solved|improved|worked|owned)\b/i.test(analysisText) },
    { label: 'Evidence', active: /\b(result|impact|metric|because|therefore|reduced|increased|percent|revenue|users)\b|\d/i.test(analysisText) },
    { label: 'Close', active: /\b(ultimately|so|next|learned|outcome|finish|conclude)\b/i.test(analysisText) || sentenceCount >= 3 },
  ]
  const structureCount = structureSignals.filter(item => item.active).length
  const clarityScore = words
    ? Math.max(48, Math.min(96, Math.round(58 + Math.min(words, 120) * 0.18 + structureCount * 5 - fillerCount * 5 - Math.max(0, avgSentence - 28) * 0.8)))
    : 0
  const qualityState = !words ? 'Waiting' : clarityScore >= 82 ? 'Controlled' : clarityScore >= 65 ? 'Developing' : 'Sparse'
  const listenActive = micOn && !aiPlaying && !feedback && !intro
  const questionType = curQ?.questionType === 'PRACTICAL' ? 'Practical' : 'Communication'

  return (
    <div
      style={{
        height: '100vh',
        background:
          `radial-gradient(circle at 22% -12%, rgba(57,255,20,0.045), transparent 32%),
           radial-gradient(circle at 88% 18%, rgba(21,128,61,0.035), transparent 30%),
           ${C.bg}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: C.text,
      }}
    >
      <video ref={camRef} style={{ display: 'none' }} playsInline muted />

      <header
        style={{
          height: 48,
          flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(18px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '0 18px',
          boxShadow: '0 1px 0 rgba(255,255,255,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <span className="status-dot live" />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: C.text, fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.15 }}>AIRA Interview OS</div>
            <Label>{aiPlaying ? 'Interviewer speaking' : listenActive ? 'Active listening' : intro ? 'Session initializing' : 'Response window'}</Label>
          </div>
          {(aiPlaying || listenActive) && <Waveform active />}
        </div>

        <div className="interview-top-pills" style={{ display: 'flex', gap: 7, alignItems: 'center', overflow: 'hidden' }}>
          <Pill label="Behavioral" value={eyeQ} tone={eyePct >= 60 ? 'good' : 'neutral'} />
          <Pill label="Pace" value={paceLabel} tone={paceLabel === 'Optimal' ? 'good' : paceLabel === 'Fast' ? 'warn' : 'neutral'} />
          <Pill label="Time" value={fmtTime(timeLeft)} tone={timeLeft > 15 ? 'good' : 'warn'} />
          <Pill label="Progress" value={`${idx + 1}/${localQ.length}`} tone="good" />
        </div>
      </header>

      <div className="interview-grid-enterprise">
        <aside className="interview-left-panel" style={{ background: 'rgba(17,17,17,0.96)', borderRight: `1px solid ${C.border}`, overflowY: 'auto' }}>
          <Section title="Interviewer Feed" style={{ padding: 16 }}>
            <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, background: '#000', position: 'relative', boxShadow: '0 14px 34px rgba(0,0,0,0.42)' }}>
              <video
                src={gender === 'male' ? maleVideo : femaleVideo}
                ref={vidRef}
                muted
                playsInline
                preload="auto"
                style={{ width: '100%', height: 'auto', display: 'block', opacity: aiPlaying ? 0.92 : 0.74, filter: 'saturate(0.84) contrast(1.06)' }}
              />
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: aiPlaying ? 'radial-gradient(circle at 50% 86%, rgba(57,255,20,0.08), transparent 42%)' : 'none' }} />
            </div>
            {aiPlaying && (
              <div style={{ marginTop: 8, background: 'rgba(4,4,4,0.82)', backdropFilter: 'blur(10px)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 10px' }}>
                <Label style={{ color: C.emeraldMuted, display: 'block', marginBottom: 4 }}>Speaking</Label>
                <p style={{ fontSize: '0.75rem', color: C.text2, lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{subtitle}</p>
              </div>
            )}
          </Section>

          {prismOn && !calibDone && (
            <Section title="Calibration">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: C.text2, fontSize: '0.8125rem' }}>Face alignment</span>
                <Label style={{ color: C.emeraldMuted }}>{Math.round(calibPct * 100)}%</Label>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.055)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.emeraldMuted, borderRadius: 2, width: `${calibPct * 100}%`, transition: 'width 0.1s' }} />
              </div>
            </Section>
          )}

          <Section title="Live Transcript">
            {transcript ? (
              <p style={{ fontSize: '0.8125rem', color: C.text2, lineHeight: 1.65 }}>"{transcript}"</p>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: C.faint, lineHeight: 1.55 }}>Awaiting response signal.</p>
            )}
          </Section>

          <Section title="Behavioral Metrics">
            <MetricRow label="Eye contact" value={`${eyePct}%`} qualifier={eyeQ} pct={eyePct} tone={eyePct >= 60 ? 'good' : 'neutral'} />
            <MetricRow label="Composure" value={`${stabPct}%`} qualifier={stabQ} pct={stabPct} tone={stabPct >= 60 ? 'good' : 'neutral'} />
            <MetricRow label="Engagement" value={engageLabel} qualifier={engageLabel} pct={engagementScore} tone={engageLabel !== 'Low' ? 'good' : 'neutral'} />
          </Section>

          <Section title="Pacing Intelligence">
            <MetricRow label="Words per minute" value={wpm ? `${wpm}` : '--'} qualifier={paceLabel} pct={wpm ? Math.min(100, Math.round((wpm / 180) * 100)) : 0} tone={paceLabel === 'Optimal' ? 'good' : paceLabel === 'Fast' ? 'warn' : 'neutral'} />
            <MetricRow label="Response density" value={`${words} words`} qualifier={words > 60 ? 'Rich' : words ? 'Building' : 'Open'} pct={Math.min(100, words)} tone={words > 35 ? 'good' : 'neutral'} />
          </Section>

          <Section title="Session Progress">
            <SegBar total={localQ.length} index={idx} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <Label>Question {idx + 1} of {localQ.length}</Label>
              <Label style={{ color: C.emeraldMuted }}>{fmtTime(timeLeft)}</Label>
            </div>
          </Section>

          <Section title="AI Communication Hints" style={{ borderBottom: 'none' }}>
            {['Lead with context', 'Keep the action specific', 'Close on measurable impact'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.emeraldDeep, opacity: 0.82 }} />
                <span style={{ color: C.text2, fontSize: '0.8125rem' }}>{item}</span>
              </div>
            ))}
          </Section>
        </aside>

        <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(4,4,4,0.74)' }}>
          <div style={{ padding: '22px 26px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={idx} style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Label style={{ color: C.emeraldMuted }}>Question {idx + 1}</Label>
                  <span style={{ width: 1, height: 13, background: C.border }} />
                  <Label>{questionType}</Label>
                </div>
                <Pill label="Quality" value={qualityState} tone={clarityScore >= 75 ? 'good' : 'neutral'} />
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '17px 18px', boxShadow: '0 18px 46px rgba(0,0,0,0.28)' }}>
                <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 650, fontSize: '1.04rem', color: C.text, lineHeight: 1.5, letterSpacing: 0 }}>
                  {intro ? 'Preparing the first interview prompt.' : curQ?.question}
                </h2>
              </div>
            </motion.div>
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '18px 26px 18px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 18, padding: '0 2px 12px' }}>
              <div>
                <Label style={{ color: listenActive ? C.emeraldMuted : C.muted }}>{listenActive ? 'Listening waveform' : aiPlaying ? 'Interviewer waveform' : 'Signal waveform'}</Label>
                <Waveform active={aiPlaying || listenActive} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Pill label="Clarity" value={clarityScore ? `${clarityScore}` : '--'} tone={clarityScore >= 75 ? 'good' : 'neutral'} />
                <Pill label="Fillers" value={`${fillerCount}`} tone={fillerCount > 2 ? 'warn' : fillerCount ? 'neutral' : 'good'} />
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: C.surface, border: `1px solid ${listenActive ? 'rgba(57,255,20,0.14)' : C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: listenActive ? `0 0 0 1px rgba(57,255,20,0.035), 0 22px 52px rgba(0,0,0,0.38)` : '0 22px 52px rgba(0,0,0,0.38)' }}>
              <div style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 14px', borderBottom: `1px solid ${C.border}`, background: C.elevated, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Label>Executive Response Editor</Label>
                  {listenActive && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="emerald-pulse" />
                      <Label style={{ color: C.emeraldMuted }}>Listening</Label>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Label>{words ? `${words} words` : 'No draft'}</Label>
                  <button
                    className="interview-icon-button"
                    onClick={() => {
                      if (intro) return
                      micOn ? stopMic() : startMic()
                      setMicOn(!micOn)
                    }}
                    disabled={intro}
                    title={micOn ? 'Mute microphone' : 'Enable microphone'}
                    style={{
                      borderColor: micOn ? 'rgba(57,255,20,0.18)' : C.border,
                      color: micOn ? C.emeraldMuted : C.muted,
                      background: micOn ? C.emeraldFaint : C.card,
                      opacity: intro ? 0.45 : 1,
                    }}
                  >
                    {micOn ? <FaMicrophone size={11} /> : <FaMicrophoneSlash size={11} />}
                  </button>
                </div>
              </div>

              <div className="interview-editor-grid" style={{ flex: 1, minHeight: 0 }}>
                <div style={{ minHeight: 0, background: C.bg2 }}>
                  {curQ?.questionType === 'PRACTICAL' ? (
                    <Editor
                      height="100%"
                      defaultLanguage="javascript"
                      value={answer}
                      onChange={v => setAnswer(v || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        readOnly: !!feedback || intro,
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        lineHeight: 21,
                      }}
                    />
                  ) : (
                    <textarea
                      placeholder={intro ? 'Session initializing.' : 'Draft a concise response with context, action, and outcome.'}
                      onChange={e => setAnswer(e.target.value)}
                      value={answer}
                      disabled={!!feedback || intro}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: 0,
                        background: 'linear-gradient(180deg, rgba(17,17,17,0.95), rgba(10,10,10,0.98))',
                        border: 'none',
                        padding: '18px 20px',
                        color: C.text,
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.9375rem',
                        resize: 'none',
                        outline: 'none',
                        lineHeight: 1.7,
                        opacity: feedback || intro ? 0.45 : 1,
                        cursor: feedback || intro ? 'not-allowed' : 'text',
                      }}
                    />
                  )}
                </div>

                <aside style={{ borderLeft: `1px solid ${C.border}`, background: C.elevated, minWidth: 220, overflow: 'auto' }}>
                  <InsightBlock title="Semantic Analysis">
                    <MetricRow label="Clarity" value={clarityScore ? `${clarityScore}/100` : '--'} qualifier={qualityState} pct={clarityScore} tone={clarityScore >= 75 ? 'good' : 'neutral'} />
                    <MetricRow label="Sentence length" value={avgSentence ? `${avgSentence}` : '--'} qualifier={avgSentence > 28 ? 'Long' : avgSentence ? 'Balanced' : 'Open'} pct={avgSentence ? Math.min(100, avgSentence * 3) : 0} tone={avgSentence > 28 ? 'warn' : avgSentence ? 'good' : 'neutral'} />
                  </InsightBlock>
                  <InsightBlock title="Structure Signals">
                    {structureSignals.map(item => <StructureItem key={item.label} {...item} />)}
                  </InsightBlock>
                  <InsightBlock title="Response Quality">
                    <p style={{ color: C.text2, fontSize: '0.8125rem', lineHeight: 1.6 }}>
                      {feedback || (words ? 'Live signal is building from the current response.' : 'Waiting for response content.')}
                    </p>
                  </InsightBlock>
                </aside>
              </div>
            </div>

            <div style={{ marginTop: 14, flexShrink: 0 }}>
              {!feedback ? (
                <button onClick={submitAnswer} disabled={submitting || intro} className="interview-primary-button" style={{ width: '100%' }}>
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {[0, 1, 2].map(i => <span key={i} className="thinking-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
                      Processing
                    </span>
                  ) : intro ? 'Preparing Session' : 'Submit Response'}
                </button>
              ) : (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '15px 16px', boxShadow: '0 14px 34px rgba(0,0,0,0.28)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 3, height: 13, borderRadius: 2, background: C.emeraldMuted }} />
                    <Label style={{ color: C.emeraldMuted }}>AI Feedback</Label>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: C.text2, lineHeight: 1.65, marginBottom: 14 }}>{feedback}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setFeedback(''); setTranscript(''); if (micOn) startMic() }} className="interview-secondary-button" style={{ flex: 1 }}>Retry</button>
                    <button onClick={handleNext} className="interview-primary-button" style={{ flex: 1 }}>
                      {idx + 1 >= localQ.length ? 'Finish Session' : 'Next Question'} <BsArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </main>

        <aside className="interview-right-panel" style={{ background: 'rgba(17,17,17,0.97)', borderLeft: `1px solid ${C.border}`, overflowY: 'auto' }}>
          <InsightBlock title="Clarity Score">
            <Gauge label="Communication clarity" value={clarityScore} sublabel={words ? `${qualityState} signal across ${words} words.` : 'Awaiting response content.'} />
          </InsightBlock>

          <InsightBlock title="Filler Word Analysis">
            <MetricRow label="Detected fillers" value={`${fillerCount}`} qualifier={fillerRate ? `${fillerRate}%` : 'Clean'} pct={Math.min(100, fillerRate * 8)} tone={fillerCount > 2 ? 'warn' : 'good'} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {fillerWords.slice(0, 6).map(word => (
                <span key={word} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '3px 7px', color: C.muted, fontSize: '0.75rem', background: C.bg2 }}>
                  {word}
                </span>
              ))}
            </div>
          </InsightBlock>

          <InsightBlock title="Pacing Metrics">
            <MetricRow label="Current pace" value={wpm ? `${wpm} wpm` : '--'} qualifier={paceLabel} pct={wpm ? Math.min(100, Math.round((wpm / 180) * 100)) : 0} tone={paceLabel === 'Optimal' ? 'good' : paceLabel === 'Fast' ? 'warn' : 'neutral'} />
            <MetricRow label="Elapsed" value={fmtTime(elapsed)} qualifier="Session" pct={Math.min(100, Math.round((elapsed / (curQ?.timeLimit || 60)) * 100))} tone="neutral" />
            <MetricRow label="Remaining" value={fmtTime(timeLeft)} qualifier={timeLeft > 15 ? 'Open' : 'Close'} pct={Math.min(100, Math.round((timeLeft / (curQ?.timeLimit || 60)) * 100))} tone={timeLeft > 15 ? 'good' : 'warn'} />
          </InsightBlock>

          <InsightBlock title="Communication Structure">
            {structureSignals.map(item => <StructureItem key={item.label} {...item} />)}
          </InsightBlock>

          <InsightBlock title="Confidence Telemetry">
            <MetricRow label="Composite" value={`${confidenceScore}%`} qualifier={confidenceScore >= 72 ? 'High' : confidenceScore >= 55 ? 'Steady' : 'Low'} pct={confidenceScore} tone={confidenceScore >= 60 ? 'good' : 'neutral'} />
            <MetricRow label="Face signal" value={metrics.faceDetected ? 'Locked' : 'Searching'} qualifier={prismOn ? 'Prism' : 'Offline'} pct={metrics.faceDetected ? 92 : 20} tone={metrics.faceDetected ? 'good' : 'neutral'} />
          </InsightBlock>
        </aside>
      </div>
    </div>
  )
}

export default Step2Interview
