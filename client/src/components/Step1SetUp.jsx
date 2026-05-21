import React from 'react'
import { motion } from "motion/react"
import {
    FaUserTie,
    FaBriefcase,
    FaFileUpload,
    FaMicrophoneAlt,
    FaChartLine,
} from "react-icons/fa";
import { useState } from 'react';
import axios from "axios"
import { ServerUrl } from '../App';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/userSlice';

const ease = [0.22, 1, 0.36, 1]

const M = ({ children, style }) => (
  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', ...style }}>{children}</span>
)

function Step1SetUp({ onStart }) {
    const {userData}= useSelector((state)=>state.user)
    const dispatch = useDispatch()
    const [role, setRole] = useState("");
    const [experience, setExperience] = useState("");
    const [mode, setMode] = useState("Technical");
    const [resumeFile, setResumeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const [resumeText, setResumeText] = useState("");
    const [atsScore, setAtsScore] = useState(null);
    const [atsFeedback, setAtsFeedback] = useState("");
    const [analysisDone, setAnalysisDone] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [startError, setStartError] = useState('');


    const handleUploadResume = async () => {
        if (!resumeFile || analyzing) return;
        setAnalyzing(true)

        const formdata = new FormData()
        formdata.append("resume", resumeFile)

        try {
            const result = await axios.post(ServerUrl + "/api/interview/resume", formdata, { withCredentials: true })

            const parsedRole = (result.data.role || "").trim();
            const parsedExperience = (result.data.experience || "").trim();
            
            setRole(parsedRole);
            setExperience(parsedExperience);
            setProjects(result.data.projects || []);
            setSkills(result.data.skills || []);
            setAtsScore(result.data.atsScore || null);
            setAtsFeedback(result.data.atsFeedback || "");
            setResumeText(result.data.resumeText || "");
            setAnalysisDone(true);

            setAnalyzing(false);

        } catch (error) {
            console.log(error)
            setAnalyzing(false);
        }
    }

    const handleStart = async () => {
        setLoading(true)
        setStartError('')
        try {
           const result = await axios.post(ServerUrl + "/api/interview/generate-questions" , {role, experience, mode , resumeText, projects, skills } , {withCredentials:true}) 
           if(userData){
            dispatch(setUserData({...userData , credits:result.data.creditsLeft}))
           }
           setLoading(false)
           onStart(result.data)
        } catch (error) {
            const msg = error?.response?.data?.message || 'Failed to start interview. Please try again.'
            setStartError(msg)
            setLoading(false)
        }
    }

    const scoreColor = atsScore >= 80 ? 'var(--accent)' : atsScore >= 60 ? 'var(--gold)' : 'var(--danger)'

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

            <div style={{
              width: '100%',
              maxWidth: '72rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              boxShadow: 'var(--shadow-xl)',
            }}>

                {/* Left panel */}
                <motion.div
                    initial={{ x: -80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    style={{
                      padding: '48px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      borderRight: '1px solid var(--border)',
                      background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
                      position: 'relative',
                    }}>

                    {/* Subtle top accent */}
                    <div style={{ position: 'absolute', top: 0, left: '24px', right: '24px', height: '2px', background: 'linear-gradient(90deg, var(--accent) 0%, transparent 70%)', borderRadius: '0 0 2px 2px' }} />

                    <h2 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.15 }}>
                        Start Your <span style={{ color: 'var(--accent)' }}>AI Interview</span>
                    </h2>

                    <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '40px', maxWidth: '380px' }}>
                        Practice real interview scenarios powered by AI.
                        Improve communication, technical skills, and confidence.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { icon: <FaUserTie size={18} />, text: "Choose Role & Experience" },
                            { icon: <FaMicrophoneAlt size={18} />, text: "Smart Voice Interview" },
                            { icon: <FaChartLine size={18} />, text: "Performance Analytics" },
                        ].map((item, index) => (
                            <motion.div key={index}
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 + index * 0.15 }}
                                whileHover={{ scale: 1.02 }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '14px',
                                  background: 'var(--bg-elevated)',
                                  border: '1px solid var(--border)',
                                  padding: '14px 16px',
                                  borderRadius: '14px',
                                  cursor: 'default',
                                  transition: 'border-color 150ms',
                                }}
                            >
                                <div style={{ color: 'var(--accent)', flexShrink: 0 }}>{item.icon}</div>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Right panel — Form */}
                <motion.div
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    style={{ padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                    <h2 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '32px' }}>
                        Interview Setup
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Role input */}
                        <div style={{ position: 'relative' }}>
                            <FaUserTie style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-muted)', fontSize: '14px' }} />
                            <input type='text' placeholder='Enter role'
                                className='input-field'
                                style={{ paddingLeft: '40px' }}
                                onChange={(e) => setRole(e.target.value)} value={role} />
                        </div>

                        {/* Experience input */}
                        <div style={{ position: 'relative' }}>
                            <FaBriefcase style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-muted)', fontSize: '14px' }} />
                            <input type='text' placeholder='Experience (e.g. 2 years)'
                                className='input-field'
                                style={{ paddingLeft: '40px' }}
                                onChange={(e) => setExperience(e.target.value)} value={experience} />
                        </div>

                        {/* Mode selector */}
                        <select value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            className='input-field'>
                            <option value="Technical">Technical Interview</option>
                            <option value="HR">HR Interview</option>
                        </select>

                        {/* Resume upload */}
                        {!analysisDone && (
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                onClick={() => document.getElementById("resumeUpload").click()}
                                style={{
                                  border: '1.5px dashed var(--border-strong)',
                                  borderRadius: '16px',
                                  padding: '32px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  background: 'var(--bg-tertiary)',
                                  transition: 'border-color 180ms, background 180ms',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                            >
                                <div style={{ color: 'var(--accent)', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                                  <FaFileUpload size={28} />
                                </div>

                                <input type="file"
                                    accept="application/pdf"
                                    id="resumeUpload"
                                    style={{ display: 'none' }}
                                    onChange={(e) => setResumeFile(e.target.files[0])} />

                                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {resumeFile ? resumeFile.name : "Click to upload resume (Optional)"}
                                </p>

                                {resumeFile && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUploadResume()
                                        }}
                                        className='btn-primary'
                                        style={{ marginTop: '16px', padding: '9px 20px' }}>
                                        {analyzing ? "Analyzing..." : "Analyze Resume"}
                                    </motion.button>)}

                            </motion.div>
                        )}

                        {/* Resume analysis results */}
                        {analysisDone && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                  background: 'var(--bg-tertiary)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '16px',
                                  padding: '20px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '16px',
                                }}>
                                <M style={{ color: 'var(--accent)' }}>Resume Analysis Result</M>

                                {atsScore !== null && (
                                    <div style={{
                                      background: 'var(--bg-elevated)',
                                      border: '1px solid var(--border)',
                                      padding: '16px',
                                      borderRadius: '14px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '16px',
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '80px' }}>
                                            <M style={{ marginBottom: '4px' }}>ATS Score</M>
                                            <span style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                                                {atsScore}%
                                            </span>
                                        </div>
                                        <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '1px solid var(--border)' }}>
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'Inter' }}>{atsFeedback}</p>
                                        </div>
                                    </div>
                                )}

                                {projects.length > 0 && (
                                    <div>
                                        <M style={{ marginBottom: '8px' }}>Projects</M>
                                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {projects.map((p, i) => (
                                                <li key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'Inter', paddingLeft: '12px', borderLeft: '2px solid var(--border)' }}>{p}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {skills.length > 0 && (
                                    <div>
                                        <M style={{ marginBottom: '8px' }}>Skills</M>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {skills.map((s, i) => (
                                                <span key={i} style={{
                                                  background: 'var(--accent-dim)',
                                                  color: 'var(--accent)',
                                                  border: '1px solid var(--accent-border)',
                                                  padding: '3px 10px',
                                                  borderRadius: '99px',
                                                  fontFamily: "'IBM Plex Mono', monospace",
                                                  fontSize: '0.6875rem',
                                                  fontWeight: 500,
                                                  letterSpacing: '0.02em',
                                                }}>{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </motion.div>
                        )}

                        {/* Start button */}
                        <motion.button
                        onClick={handleStart}
                            disabled={!role.trim() || !experience.trim() || loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className='btn-primary'
                            style={{
                              width: '100%',
                              padding: '13px',
                              borderRadius: '99px',
                              fontSize: '1rem',
                              fontWeight: 600,
                              justifyContent: 'center',
                            }}>
                            {loading ? "Starting..." : "Start Interview"}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default Step1SetUp
