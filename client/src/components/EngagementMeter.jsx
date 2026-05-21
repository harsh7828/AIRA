import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaHeadphones, FaExclamationTriangle, FaCheckCircle, FaBrain, FaEyeSlash, FaCrosshairs } from 'react-icons/fa';

/**
 * EngagementMeter - Prism HUD Component
 * Redesigned as a professional medical/flight instrument
 */

// Flight Instrument style Vibe Ring (Crosshairs & framing)
export const VibeRingOverlay = ({ metrics, size = 'large' }) => {
  const {
    eyeContactRatio = 0,
    isDistracted = false,
    isThinking = false,
    engagementLevel = 'Low',
    faceDetected = false,
  } = metrics || {};

  if (!faceDetected) return null;

  const sizeMap = {
    small: 150,
    medium: 200,
    large: 250,
    xlarge: 300,
  };

  const ringSize = sizeMap[size] || sizeMap.large;
  
  // Muted status colors
  const statusColor = isDistracted ? 'rgba(255,255,255,0.2)' : isThinking ? 'rgba(255,255,255,0.15)' : 'var(--accent)';

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ width: ringSize, height: ringSize }}
    >
       <div className="absolute top-0 left-0 w-6 h-6 border-t-[1px] border-l-[1px] opacity-70" style={{ borderColor: statusColor }}></div>
       <div className="absolute top-0 right-0 w-6 h-6 border-t-[1px] border-r-[1px] opacity-70" style={{ borderColor: statusColor }}></div>
       <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[1px] border-l-[1px] opacity-70" style={{ borderColor: statusColor }}></div>
       <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[1px] border-r-[1px] opacity-70" style={{ borderColor: statusColor }}></div>
       
       {isDistracted && <span className="absolute top-[-24px] text-[10px] font-mono tracking-widest text-slate-500 uppercase">SYS_WARN_DIST</span>}
       {isThinking && <span className="absolute top-[-24px] text-[10px] font-mono tracking-widest text-slate-500 uppercase">SYS_CALC</span>}
    </div>
  );
};

// Engagement status indicator
const EngagementStatus = ({ metrics }) => {
  const {
    isDistracted = false,
    isThinking = false,
    faceDetected = false,
    engagementLevel = 'Low',
    activeListeningNods = 0,
  } = metrics || {};

  // Get status message
  const getStatusMessage = () => {
    if (!faceDetected) return { text: 'SYS_NO_TGT', icon: FaEyeSlash, color: 'text-slate-400' };
    if (isDistracted) return { text: 'WARN: FOCUS_LOST', icon: FaExclamationTriangle, color: 'text-slate-500' };
    if (isThinking) return { text: 'SYS_CALCULATING', icon: FaBrain, color: 'text-slate-500' };
    if (engagementLevel === 'High') return { text: 'LOCK_ENGAGED', icon: FaCheckCircle, color: 'text-[var(--accent)]' };
    if (engagementLevel === 'Medium') return { text: 'LOCK_NOMINAL', icon: FaCheckCircle, color: 'text-slate-500' };
    return { text: 'WARN: LOW_LOCK', icon: FaEye, color: 'text-slate-500' };
  };

  const status = getStatusMessage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-between border-t border-[var(--border)] pt-3 mt-3"
    >
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-mono tracking-wider ${status.color}`}>
          {status.text}
        </span>
      </div>
      {activeListeningNods > 0 && (
        <span className="text-[10px] font-mono text-slate-400">
          NOD_CNT: {activeListeningNods}
        </span>
      )}
    </motion.div>
  );
};

// Metric bar component
const MetricBar = ({ label, value }) => {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">{label}</span>
        <span className="text-[10px] font-mono font-medium text-slate-700 dark:text-slate-300">
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      {/* Step Indicator instead of standard progress bar */}
      <div className="flex gap-[2px] h-1.5 w-full">
        {Array.from({ length: 10 }).map((_, i) => {
          const threshold = (i + 1) * 10;
          const isActive = (value * 100) >= threshold;
          return (
            <div 
              key={i} 
              className={`flex-1 transition-colors duration-300 ${isActive ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} 
            />
          );
        })}
      </div>
    </div>
  );
};

// Main EngagementMeter component
const EngagementMeter = ({ metrics, isVisible = true, position = 'top-right', mode = 'pro' }) => {
  const {
    eyeContactRatio = 0,
    headPoseStability = 1.0,
    faceDetected = false,
    sentimentScore = 0.5,
  } = metrics || {};

  const [displayMetrics, setDisplayMetrics] = useState({
    eyeContact: 0,
    stability: 0,
    sentiment: 0.5,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayMetrics({
        eyeContact: eyeContactRatio,
        stability: headPoseStability,
        sentiment: sentimentScore,
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [eyeContactRatio, headPoseStability, sentimentScore]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (mode === 'minimalist') {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 flex items-center gap-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-3 py-1.5 shadow-sm`}>
        <div className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-[var(--accent)]' : 'bg-slate-600'}`} />
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          SYS_MONITOR
        </span>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed ${positionClasses[position]} z-50`}
    >
      <div className="bg-[var(--bg-secondary)] shadow-md border border-[var(--border)] p-4 w-64 rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-2">
          <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200 tracking-widest uppercase">
            TEL_PRISM_v2
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-400 tracking-wider">
              {faceDetected ? 'TRK_ACTV' : 'TRK_FAIL'}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-[var(--accent)] animate-pulse' : 'bg-slate-600'}`} />
          </div>
        </div>

        <MetricBar label="EYE_TRK" value={displayMetrics.eyeContact} />
        <MetricBar label="STB_IDX" value={displayMetrics.stability} />
        <MetricBar label="SNT_VAL" value={displayMetrics.sentiment} />

        <AnimatePresence mode="wait">
          <EngagementStatus key={metrics?.isDistracted ? 'distracted' : metrics?.isThinking ? 'thinking' : 'engaged'} metrics={metrics} />
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const MiniEngagementMeter = ({ metrics, isVisible = true }) => {
  if (!isVisible) return null;
  return null; // Deprecated in favor of the new HUD minimalist mode
};

export const HUDToggle = ({ mode, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="fixed top-4 right-4 z-50 bg-[var(--bg-tertiary)] p-2 shadow-sm border border-[var(--border)] hover:opacity-80 transition rounded-lg flex items-center justify-center"
      title="Toggle Telemetry Mode"
    >
      <span className="text-[10px] font-mono tracking-wider font-bold text-slate-600 dark:text-slate-300 uppercase">
        {mode === 'pro' ? 'MIN' : 'PRO'}
      </span>
    </button>
  );
};

export default EngagementMeter;