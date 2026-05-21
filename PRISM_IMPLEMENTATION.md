# Prism Behavioral Analytics - Implementation Documentation

## Overview

Prism is an intelligent behavioral coaching system integrated into the AIRA platform. It uses MediaPipe FaceMesh to track facial landmarks and provide real-time feedback on user engagement, attention, and emotional state during AI-powered interviews.

**Privacy First**: Only numerical landmark data is processed and stored. No raw video frames are captured, saved, or transmitted.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AIRA Platform                                │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Step2Interview.jsx                            ││
│  │  - Manages interview flow                                        ││
│  │  - Initializes PrismTracker                                      ││
│  │  - Handles calibration phase                                     ││
│  │  - Sends behavioral data to server                               ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      prismEngine.js                              ││
│  │  ┌─────────────────────────────────────────────────────────────┐││
│  │  │                    PrismTracker Class                        │││
│  │  │  - Calibration (5s baseline recording)                       │││
│  │  │  - Gaze Classification (Thinking vs Distraction)             │││
│  │  │  - Sentiment Detection (Action Units)                        │││
│  │  │  - Active Listener Detection (Nodding)                       │││
│  │  │  - Adaptive FPS (Performance optimization)                   │││
│  │  └─────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                   EngagementMeter.jsx                            ││
│  │  - Vibe Ring visualization                                       ││
│  │  - Pro/Minimalist mode toggle                                    ││
│  │  - Real-time metrics display                                     ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    prismWorker.js (Optional)                     ││
│  │  - Web Worker for offloaded FaceMesh processing                  ││
│  │  - Keeps main thread at 60 FPS                                   ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Server (Node.js)                             │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                   interview.controller.js                        ││
│  │  - finishInterview() saves behavioral data                       ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                     interview.model.js                           ││
│  │  - Stores behavioralData, sentimentScore                         ││
│  │  - Stores activeListeningNods, engagementLevel                   ││
│  │  - Stores gazeAnalysis                                           ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Calibration Phase

The `calibrate()` function records 5 seconds of baseline facial coordinates to establish dynamic thresholds.

**Implementation** (`prismEngine.js`):
```javascript
async calibrate(onProgress = null) {
  // Records 5 seconds of baseline data
  // Calculates average offsets for center gaze
  // Sets dynamic thresholds based on variance
  // Returns calibration status
}
```

**Calibrated Metrics**:
- `centerX`, `centerY`: Average face position offsets
- `tolerance`: Gaze classification tolerance (2 standard deviations)
- `eyeContactThreshold`: Dynamic eye contact threshold
- `baselineSentiment`: Baseline mouth width and brow distance

### 2. Intelligent Gaze Classification

Differentiates between "Distraction" and "Cognitive Load" (Thinking).

**Logic**:
- **Thinking Pattern**: Gaze shifts Up-Left or Up-Right for < 3000ms during response
  - These are common memory retrieval cues
  - Flagged as `isThinking: true`
- **Distraction Pattern**: Gaze shifts Down/Sideways for > 3000ms
  - Indicates loss of focus
  - Flagged as `isDistracted: true`

**Gaze Zones**:
- `center`: Looking at camera
- `left`, `right`: Sideways gaze
- `up-left`, `up-right`: Upward gaze (thinking indicators)
- `down`: Downward gaze
- `unknown`: Unable to classify

### 3. Active Listener & Sentiment Pulse

Uses FaceMesh Action Units to detect engagement behaviors.

**Nodding Detection**:
- Analyzes periodic Y-axis (pitch) oscillation during AI speech
- Counts nods as `activeListeningNods`

**Sentiment Detection**:
- **Mouth Analysis**: Distance between landmarks 61 and 291 (mouth corners)
- **Brow Furrowing**: Distance between landmarks 4 and 9 (brows)
- **Sentiment Score**: 0-1 scale combining mouth openness and brow relaxation
- **Engagement Level**: Low, Medium, or High

### 4. Vibe Ring UI

A pulsing SVG border around the user's video feed that visually represents engagement state.

**States**:
- **Blue/Steady**: Focused (High engagement)
- **Yellow/Pulsing**: Thinking/Processing
- **Soft Red/Fading**: Needs more eye contact (Distracted)

**Implementation** (`EngagementMeter.jsx`):
```javascript
const VibeRing = ({ engagementLevel, isThinking, isDistracted, size }) => {
  // SVG circle with animated stroke
  // Color and pulse speed based on state
  // Drop shadow glow effect
}
```

### 5. Performance Optimization

**Adaptive FPS**:
- Monitors frame processing time
- If frame drops detected (>14ms per frame), throttles sampling
- Automatically adjusts to maintain 60 FPS UI

**Web Worker** (`prismWorker.js`):
- Offloads FaceMesh processing to background thread
- Communicates via message passing
- Only numerical data transmitted (privacy-preserving)

## API Payload

### Finish Interview Request

```javascript
{
  interviewId: string,
  behavioralData: {
    totalDuration: number,
    totalSamples: number,
    overallEyeContact: number,
    overallStability: number,
    totalDistractionTime: number,
    totalThinkingTime: number,
    sentimentScore: number,
    activeListeningNods: number,
    engagementLevel: "Low" | "Medium" | "High",
    gazeZoneDistribution: {
      center: number,
      left: number,
      right: number,
      'up-left': number,
      'up-right': number,
      down: number,
      unknown: number,
    },
    questionBreakdown: {
      q0: { avgEyeContact, avgStability, distractionCount, thinkingCount, avgSentimentScore },
      // ... for each question
    }
  },
  sentimentScore: number,      // 0-1
  activeListeningNods: number, // count
  engagementLevel: string,     // "Low" | "Medium" | "High"
}
```

### Finish Interview Response

```javascript
{
  finalScore: number,
  confidence: number,
  communication: number,
  correctness: number,
  questionWiseScore: Array,
  behavioralData: Object,
  sentimentScore: number,
  activeListeningNods: number,
  engagementLevel: string,
  gazeAnalysis: {
    distribution: Object,
    totalDistractionTime: number,
    totalThinkingTime: number,
  }
}
```

## File Structure

```
AIRA/
├── client/
│   └── src/
│       ├── utils/
│       │   ├── prismEngine.js      # Main tracking engine
│       │   └── prismWorker.js      # Web Worker for offloading
│       └── components/
│           ├── EngagementMeter.jsx # HUD with Vibe Ring
│           └── Step2Interview.jsx  # Interview component
├── server/
│   ├── models/
│   │   └── interview.model.js      # Schema with behavioral fields
│   └── controllers/
│       └── interview.controller.js # API handlers
└── PRISM_IMPLEMENTATION.md         # This document
```

## Usage

### Initializing Prism

```javascript
import { PrismTracker } from '../utils/prismEngine';

// Create tracker
const tracker = new PrismTracker(videoElement, {
  onMetricsUpdate: (metrics) => {
    console.log('Metrics:', metrics);
  }
});

// Start tracking
await tracker.start();

// Run calibration (5 seconds)
await tracker.calibrate((progress) => {
  console.log(`Calibrating: ${Math.round(progress * 100)}%`);
});

// Set AI playing state for active listener detection
tracker.setAIPlayingState(isAIPlaying);

// Get session report
const report = tracker.getSessionReport();
```

### Using the Vibe Ring

```javascript
import { VibeRingOverlay } from './EngagementMeter';

// Overlay on video feed
<VibeRingOverlay 
  metrics={prismMetrics} 
  size="large" 
/>
```

### HUD Mode Toggle

```javascript
import { HUDToggle } from './EngagementMeter';

// Toggle between 'pro' and 'minimalist' modes
<HUDToggle 
  mode={hudMode} 
  onToggle={() => setHudMode(hudMode === 'pro' ? 'minimalist' : 'pro')}
/>
```

## Configuration

### PRISM_CONFIG (prismEngine.js)

```javascript
{
  EYE_CONTACT_THRESHOLD: 0.6,    // Dynamic after calibration
  PITCH_THRESHOLD: 0.35,         // Up/down tilt threshold
  YAW_THRESHOLD: 0.4,            // Left/right turn threshold
  ROLL_THRESHOLD: 0.2,           // Side tilt threshold
  THINKING_DURATION_MS: 3000,    // Threshold for thinking vs distraction
  DISTRACTION_DURATION_MS: 2000, // Time before marking as distracted
  SAMPLE_INTERVAL_MS: 100,       // Processing sample rate
  ADAPTIVE_FPS_THRESHOLD: 14,    // Frame time threshold for adaptive FPS
  SMOOTHING_FACTOR: 0.3,         // Moving average smoothing
  STABILITY_WINDOW_SIZE: 30,     // Samples for stability calculation
  CALIBRATION_DURATION_MS: 5000, // Calibration phase duration
}
```

## Landmark Indices

Key FaceMesh landmarks used:

| Landmark | Index | Purpose |
|----------|-------|---------|
| Left Eye Outer | 33 | Eye tracking |
| Left Eye Inner | 133 | Eye tracking |
| Right Eye Outer | 362 | Eye tracking |
| Right Eye Inner | 263 | Eye tracking |
| Nose Tip | 1 | Head pose |
| Nose Base | 6 | Head pose |
| Face Left | 234 | Face boundary |
| Face Right | 454 | Face boundary |
| Forehead | 10 | Head pose |
| Chin | 152 | Head pose |
| Mouth Left | 61 | Sentiment |
| Mouth Right | 291 | Sentiment |
| Brow Left | 4 | Sentiment |
| Brow Right | 9 | Sentiment |

## Privacy Considerations

1. **No Raw Video Storage**: Only numerical landmark coordinates are processed
2. **Local Processing**: All FaceMesh analysis happens client-side
3. **Minimal Data Transmission**: Only aggregated metrics sent to server
4. **No Face Recognition**: Landmarks are anonymized numerical data
5. **Session-Based**: Data is not persisted beyond the interview session

## Troubleshooting

### Calibration Fails
- Ensure adequate lighting
- Face should be clearly visible
- Stay relatively still during calibration

### High CPU Usage
- Enable Web Worker mode for offloaded processing
- Reduce video resolution in getUserMedia options
- Adaptive FPS will automatically throttle if needed

### Inaccurate Gaze Detection
- Re-run calibration
- Ensure camera is positioned at eye level
- Check that face is not at extreme angles

## Future Enhancements

1. **Micro-expression Detection**: Detect subtle emotional cues
2. **Voice Stress Analysis**: Correlate vocal patterns with engagement
3. **Multi-person Tracking**: Support for panel interviews
4. **Real-time Coaching**: Provide live feedback during interview
5. **Historical Trends**: Track improvement across multiple interviews