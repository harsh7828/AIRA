/**
 * Prism Engine - Intelligent Behavioral Coaching System
 * 
 * Uses MediaPipe FaceMesh to track facial landmarks and calculate:
 * - Eye contact ratio with dynamic calibration
 * - Intelligent gaze classification (Thinking vs Distraction)
 * - Active listener detection (nodding, sentiment)
 * - Head pose stability and composure
 * 
 * Privacy: Only numerical landmark data is processed and stored.
 * No raw video frames are saved or transmitted.
 */

// MediaPipe FaceMesh is loaded from CDN (not bundled via npm).
// This avoids Vite bundler incompatibilities with the @mediapipe package.
let _faceMeshLoaded = false;
async function loadFaceMeshFromCDN() {
  if (window.FaceMesh) return window.FaceMesh;
  if (_faceMeshLoaded) {
    // Already injected, wait for it
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (window.FaceMesh) { clearInterval(check); resolve(window.FaceMesh); }
      }, 100);
    });
  }
  _faceMeshLoaded = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.FaceMesh);
    script.onerror = () => reject(new Error('Failed to load MediaPipe FaceMesh from CDN'));
    document.head.appendChild(script);
  });
}

// Key landmark indices for eye and head tracking
const LANDMARK_INDICES = {
  // Eyes corners and centers
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_OUTER: 362,
  RIGHT_EYE_INNER: 263,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  
  // Nose tip and base for head pose estimation
  NOSE_TIP: 1,
  NOSE_BASE: 6,
  
  // Face contour for head pose
  FACE_TOP: 10,
  FACE_BOTTOM: 152,
  FACE_LEFT: 234,
  FACE_RIGHT: 454,
  
  // Upper face for head tilt
  FOREHEAD: 10,
  CHIN: 152,
  
  // Mouth landmarks for sentiment detection
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  
  // Brow landmarks for sentiment detection
  BROW_LEFT_OUTER: 4,
  BROW_RIGHT_OUTER: 9,
  
  // Gaze zone reference points
  GAZE_CENTER: { x: 0.5, y: 0.35 },
  GAZE_LEFT: { x: 0.3, y: 0.35 },
  GAZE_RIGHT: { x: 0.7, y: 0.35 },
  GAZE_UP_LEFT: { x: 0.3, y: 0.15 },
  GAZE_UP_RIGHT: { x: 0.7, y: 0.15 },
  GAZE_DOWN: { x: 0.5, y: 0.6 },
};

// Configuration for Prism tracking
const PRISM_CONFIG = {
  // Thresholds for eye contact detection (will be calibrated)
  EYE_CONTACT_THRESHOLD: 0.6,
  
  // Head pose stability thresholds (in radians)
  PITCH_THRESHOLD: 0.35,   // Up/down tilt
  YAW_THRESHOLD: 0.4,      // Left/right turn
  ROLL_THRESHOLD: 0.2,     // Side tilt
  
  // Distraction vs Thinking detection
  THINKING_DURATION_MS: 3000,  // Threshold for thinking vs distraction
  DISTRACTION_DURATION_MS: 2000, // Time before marking as distracted
  
  // Sampling
  SAMPLE_INTERVAL_MS: 100,       // How often to sample (10 FPS for processing)
  ADAPTIVE_FPS_THRESHOLD: 14,    // Frame time threshold for adaptive FPS
  
  // Smoothing factor for moving average
  SMOOTHING_FACTOR: 0.3,
  
  // Window size for stability calculation
  STABILITY_WINDOW_SIZE: 30, // Number of samples for stability calculation
  
  // Calibration duration
  CALIBRATION_DURATION_MS: 5000,
  
  // Sentiment detection thresholds
  SENTIMENT_NEUTRAL_MOUTH: 0.15,  // Baseline mouth width ratio
  SENTIMENT_BROW_THRESHOLD: 0.05, // Brow furrowing threshold
};

/**
 * Calculate eye aspect ratio (EAR) for one eye
 * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 * Higher EAR indicates more open eyes, but we use it for gaze direction
 */
function calculateEyeAspectRatio(landmarks, isLeft) {
  const eyeIndices = isLeft 
    ? [LANDMARK_INDICES.LEFT_EYE_TOP, LANDMARK_INDICES.LEFT_EYE_BOTTOM, 
       LANDMARK_INDICES.LEFT_EYE_OUTER, LANDMARK_INDICES.LEFT_EYE_INNER]
    : [LANDMARK_INDICES.RIGHT_EYE_TOP, LANDMARK_INDICES.RIGHT_EYE_BOTTOM,
       LANDMARK_INDICES.RIGHT_EYE_OUTER, LANDMARK_INDICES.RIGHT_EYE_INNER];
  
  const top = landmarks[eyeIndices[0]];
  const bottom = landmarks[eyeIndices[1]];
  const outer = landmarks[eyeIndices[2]];
  const inner = landmarks[eyeIndices[3]];
  
  const verticalDist = Math.sqrt(
    Math.pow(top.z - bottom.z, 2) + Math.pow(top.y - bottom.y, 2)
  );
  const horizontalDist = Math.sqrt(
    Math.pow(outer.z - inner.z, 2) + Math.pow(outer.y - inner.y, 2)
  );
  
  return horizontalDist > 0 ? verticalDist / horizontalDist : 0;
}

/**
 * Estimate head pose angles from facial landmarks
 * Returns pitch, yaw, roll in approximate radians
 */
function estimateHeadPose(landmarks) {
  const noseTip = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const noseBase = landmarks[LANDMARK_INDICES.NOSE_BASE];
  const faceLeft = landmarks[LANDMARK_INDICES.FACE_LEFT];
  const faceRight = landmarks[LANDMARK_INDICES.FACE_RIGHT];
  const forehead = landmarks[LANDMARK_INDICES.FOREHEAD];
  const chin = landmarks[LANDMARK_INDICES.CHIN];
  
  if (!noseTip || !noseBase || !faceLeft || !faceRight || !forehead || !chin) {
    return { pitch: 0, yaw: 0, roll: 0 };
  }
  
  // Calculate face center
  const faceCenterX = (faceLeft.x + faceRight.x) / 2;
  const faceCenterY = (forehead.y + chin.y) / 2;
  
  // Yaw: based on nose position relative to face center
  const noseOffsetX = noseTip.x - faceCenterX;
  const yaw = Math.atan2(noseOffsetX, 0.5) * 2;
  
  // Pitch: based on nose length (foreshortening)
  const noseLength = Math.sqrt(
    Math.pow(noseTip.y - noseBase.y, 2) + Math.pow(noseTip.x - noseBase.x, 2)
  );
  const pitch = (noseLength - 0.1) * 5; // Normalized estimate
  
  // Roll: based on eye line angle
  const leftEye = landmarks[LANDMARK_INDICES.LEFT_EYE_INNER];
  const rightEye = landmarks[LANDMARK_INDICES.RIGHT_EYE_INNER];
  if (leftEye && rightEye) {
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    return { pitch, yaw, roll };
  }
  
  return { pitch, yaw, roll: 0 };
}

/**
 * Determine if user is looking at camera based on landmarks
 */
function isLookingAtCamera(landmarks, calibratedThresholds = null) {
  if (!landmarks) return false;
  
  const noseTip = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const leftEye = landmarks[LANDMARK_INDICES.LEFT_EYE_INNER];
  const rightEye = landmarks[LANDMARK_INDICES.RIGHT_EYE_INNER];
  
  if (!noseTip || !leftEye || !rightEye) return false;
  
  // Check if eyes are roughly centered and nose is between them
  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const noseOffset = Math.abs(noseTip.x - eyeMidX);
  
  // Check if face is relatively straight (not turned away)
  const faceLeft = landmarks[LANDMARK_INDICES.FACE_LEFT];
  const faceRight = landmarks[LANDMARK_INDICES.FACE_RIGHT];
  
  if (!faceLeft || !faceRight) return false;
  
  const faceWidth = Math.abs(faceRight.x - faceLeft.x);
  const symmetry = Math.abs(
    Math.abs(noseTip.x - faceLeft.x) - Math.abs(faceRight.x - noseTip.x)
  );
  
  // Use calibrated threshold if available
  const threshold = calibratedThresholds?.eyeContactThreshold || 0.1;
  const symmetryThreshold = calibratedThresholds?.symmetryThreshold || 0.3;
  
  return noseOffset < threshold && symmetry < faceWidth * symmetryThreshold;
}

/**
 * Classify gaze zone based on nose tip position
 * Returns: 'center', 'left', 'right', 'up-left', 'up-right', 'down', or 'unknown'
 */
function classifyGazeZone(landmarks, calibratedOffsets = null) {
  if (!landmarks) return 'unknown';
  
  const noseTip = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const faceLeft = landmarks[LANDMARK_INDICES.FACE_LEFT];
  const faceRight = landmarks[LANDMARK_INDICES.FACE_RIGHT];
  const forehead = landmarks[LANDMARK_INDICES.FOREHEAD];
  const chin = landmarks[LANDMARK_INDICES.CHIN];
  
  if (!noseTip || !faceLeft || !faceRight || !forehead || !chin) return 'unknown';
  
  const faceCenterX = (faceLeft.x + faceRight.x) / 2;
  const faceCenterY = (forehead.y + chin.y) / 2;
  const faceWidth = Math.abs(faceRight.x - faceLeft.x);
  const faceHeight = Math.abs(chin.y - forehead.y);
  
  // Calculate offset from center
  const offsetX = (noseTip.x - faceCenterX) / faceWidth;
  const offsetY = (noseTip.y - faceCenterY) / faceHeight;
  
  // Use calibrated offsets if available
  const centerX = calibratedOffsets?.centerX || 0;
  const centerY = calibratedOffsets?.centerY || 0;
  const tolerance = calibratedOffsets?.tolerance || 0.1;
  
  const normalizedOffsetX = offsetX - centerX;
  const normalizedOffsetY = offsetY - centerY;
  
  // Classify gaze zone
  if (normalizedOffsetY < -tolerance) {
    // Looking up
    if (normalizedOffsetX < -tolerance) return 'up-left';
    if (normalizedOffsetX > tolerance) return 'up-right';
    return 'up';
  } else if (normalizedOffsetY > tolerance) {
    // Looking down
    return 'down';
  } else {
    // Horizontal plane
    if (normalizedOffsetX < -tolerance) return 'left';
    if (normalizedOffsetX > tolerance) return 'right';
    return 'center';
  }
}

/**
 * Calculate sentiment score based on facial action units
 * Returns sentimentScore (0-1) and engagement indicators
 */
function calculateSentiment(landmarks, baselineSentiment = null) {
  if (!landmarks) return { sentimentScore: 0.5, engagementLevel: 'Low', mouthOpenness: 0, browFurrow: 0 };
  
  const mouthLeft = landmarks[LANDMARK_INDICES.MOUTH_LEFT];
  const mouthRight = landmarks[LANDMARK_INDICES.MOUTH_RIGHT];
  const browLeft = landmarks[LANDMARK_INDICES.BROW_LEFT_OUTER];
  const browRight = landmarks[LANDMARK_INDICES.BROW_RIGHT_OUTER];
  const noseTip = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const chin = landmarks[LANDMARK_INDICES.CHIN];
  
  if (!mouthLeft || !mouthRight || !browLeft || !browRight || !noseTip || !chin) {
    return { sentimentScore: 0.5, engagementLevel: 'Low', mouthOpenness: 0, browFurrow: 0 };
  }
  
  // Calculate mouth width (indicator of speaking/smiling)
  const mouthWidth = Math.sqrt(
    Math.pow(mouthRight.x - mouthLeft.x, 2) + 
    Math.pow(mouthRight.y - mouthLeft.y, 2)
  );
  
  // Calculate face width for normalization
  const faceLeft = landmarks[LANDMARK_INDICES.FACE_LEFT];
  const faceRight = landmarks[LANDMARK_INDICES.FACE_RIGHT];
  const faceWidth = Math.abs(faceRight.x - faceLeft.x);
  const normalizedMouthWidth = faceWidth > 0 ? mouthWidth / faceWidth : 0;
  
  // Calculate brow furrowing (indicator of concentration/confusion)
  const browDistance = Math.sqrt(
    Math.pow(browRight.x - browLeft.x, 2) + 
    Math.pow(browRight.y - browLeft.y, 2)
  );
  const normalizedBrowDistance = faceWidth > 0 ? browDistance / faceWidth : 0;
  
  // Baseline comparison if available
  const baselineMouth = baselineSentiment?.mouthWidth || PRISM_CONFIG.SENTIMENT_NEUTRAL_MOUTH;
  const baselineBrow = baselineSentiment?.browDistance || 0.5;
  
  // Calculate sentiment indicators
  const mouthOpenness = Math.min(1, normalizedMouthWidth / baselineMouth);
  const browFurrow = Math.max(0, 1 - (normalizedBrowDistance / baselineBrow));
  
  // Combined sentiment score (higher = more positive/engaged)
  const sentimentScore = Math.max(0, Math.min(1, 
    0.4 * mouthOpenness + 
    0.3 * (1 - browFurrow) + 
    0.3 * (1 - Math.abs(normalizedMouthWidth - baselineMouth))
  ));
  
  // Determine engagement level
  let engagementLevel = 'Low';
  if (sentimentScore >= 0.7) engagementLevel = 'High';
  else if (sentimentScore >= 0.4) engagementLevel = 'Medium';
  
  return {
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    engagementLevel,
    mouthOpenness: Math.round(mouthOpenness * 100) / 100,
    browFurrow: Math.round(browFurrow * 100) / 100,
  };
}

/**
 * Detect nodding behavior (periodic Y-axis oscillation)
 */
function detectNodding(poseHistory, isAIPlaying) {
  if (!isAIPlaying || poseHistory.length < 10) return false;
  
  // Get recent pitch values (last 10 samples)
  const recentPitch = poseHistory.slice(-10).map(p => p.pitch);
  
  // Check for oscillation pattern
  let oscillationCount = 0;
  for (let i = 2; i < recentPitch.length; i++) {
    const prevPrev = recentPitch[i - 2];
    const prev = recentPitch[i - 1];
    const current = recentPitch[i];
    
    // Detect direction changes (indicative of nodding)
    if ((prev - prevPrev) * (current - prev) < 0) {
      oscillationCount++;
    }
  }
  
  // If there are at least 3 oscillations in 10 samples, likely nodding
  return oscillationCount >= 3;
}

/**
 * PrismTracker Class
 * Main class for tracking gaze and attention during interviews
 */
export class PrismTracker {
  constructor(videoElement, options = {}) {
    this.video = videoElement;
    this.options = { ...PRISM_CONFIG, ...options };
    
    // State
    this.isRunning = false;
    this.isCalibrated = false;
    this.faceMesh = null;
    this.animationFrameId = null;
    
    // Calibration data
    this.calibrationData = {
      centerX: 0,
      centerY: 0,
      tolerance: 0.1,
      eyeContactThreshold: 0.1,
      symmetryThreshold: 0.3,
      baselineSentiment: { mouthWidth: 0.15, browDistance: 0.5 },
    };
    
    // Metrics storage
    this.currentMetrics = {
      eyeContactRatio: 0,
      headPoseStability: 1.0,
      isDistracted: false,
      isThinking: false,
      lastLookAwayTime: null,
      gazeZone: 'unknown',
      sentimentScore: 0.5,
      engagementLevel: 'Low',
      activeListeningNods: 0,
      faceDetected: false,
    };
    
    // Session data for reporting
    this.sessionData = {
      samples: [],
      startTime: null,
      questionData: {},
      totalNods: 0,
      avgSentimentScore: 0,
    };
    
    // History for stability calculation
    this.poseHistory = [];
    this.eyeContactHistory = [];
    this.gazeHistory = [];
    this.currentQuestionIndex = -1;
    
    // Gaze tracking for thinking/distraction classification
    this.gazeShiftStart = null;
    this.currentGazeZone = 'center';
    
    // Nodding detection
    this.noddingState = {
      isNodding: false,
      nodCount: 0,
      lastNodTime: 0,
    };
    
    // Performance tracking for adaptive FPS
    this.performanceData = {
      lastFrameTime: 0,
      frameDrops: 0,
      currentFPS: 60,
      adaptiveMode: false,
    };
    
    // Callbacks
    this.onMetricsUpdate = options.onMetricsUpdate || null;
    
    // Async CDN load — store the promise so start() can await it
    this._initPromise = this._initFaceMesh();
  }
  
  async _initFaceMesh() {
    const FaceMesh = await loadFaceMeshFromCDN();
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });
    
    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    
    this.faceMesh.onResults(this._onResults.bind(this));
  }
  
  /**
   * CALIBRATION PHASE
   * Records 5 seconds of baseline coordinates for dynamic threshold calculation
   */
  async calibrate(onProgress = null) {
    return new Promise((resolve) => {
      console.log('Starting Prism calibration phase...');
      
      const calibrationSamples = [];
      const startTime = Date.now();
      const calibrationDuration = this.options.CALIBRATION_DURATION_MS;
      
      const collectSample = () => {
        if (!this.isRunning) {
          resolve(false);
          return;
        }
        
        const elapsed = Date.now() - startTime;
        
        if (onProgress) {
          onProgress(Math.min(1, elapsed / calibrationDuration));
        }
        
        if (elapsed >= calibrationDuration) {
          // Process collected samples
          this._processCalibrationData(calibrationSamples);
          this.isCalibrated = true;
          console.log('Prism calibration complete. Dynamic thresholds set.');
          resolve(true);
          return;
        }
        
        // Collect sample if face is detected
        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
          this.faceMesh.send({ image: this.video }).then(() => {
            // Results will be processed in _onResults, but we collect here
          }).catch(() => {});
        }
        
        requestAnimationFrame(collectSample);
      };
      
      // Override onResults temporarily for calibration
      const originalOnResults = this._onResults.bind(this);
      this._calibrationOnResults = (results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          calibrationSamples.push({
            landmarks: [...landmarks],
            pose: estimateHeadPose(landmarks),
            sentiment: calculateSentiment(landmarks),
          });
        }
      };
      
      this.faceMesh.onResults = this._calibrationOnResults;
      
      // Start calibration
      collectSample();
    });
  }
  
  _processCalibrationData(samples) {
    if (samples.length === 0) {
      console.warn('No calibration samples collected, using defaults');
      return;
    }
    
    // Calculate average offsets for center gaze
    const avgOffsetX = samples.reduce((sum, s) => {
      const lm = s.landmarks;
      const noseTip = lm[LANDMARK_INDICES.NOSE_TIP];
      const faceLeft = lm[LANDMARK_INDICES.FACE_LEFT];
      const faceRight = lm[LANDMARK_INDICES.FACE_RIGHT];
      if (!noseTip || !faceLeft || !faceRight) return sum;
      const faceCenterX = (faceLeft.x + faceRight.x) / 2;
      const faceWidth = Math.abs(faceRight.x - faceLeft.x);
      return sum + (noseTip.x - faceCenterX) / faceWidth;
    }, 0) / samples.length;
    
    const avgOffsetY = samples.reduce((sum, s) => {
      const lm = s.landmarks;
      const noseTip = lm[LANDMARK_INDICES.NOSE_TIP];
      const forehead = lm[LANDMARK_INDICES.FOREHEAD];
      const chin = lm[LANDMARK_INDICES.CHIN];
      if (!noseTip || !forehead || !chin) return sum;
      const faceCenterY = (forehead.y + chin.y) / 2;
      const faceHeight = Math.abs(chin.y - forehead.y);
      return sum + (noseTip.y - faceCenterY) / faceHeight;
    }, 0) / samples.length;
    
    // Calculate variance for tolerance
    const varianceX = samples.reduce((sum, s) => {
      const lm = s.landmarks;
      const noseTip = lm[LANDMARK_INDICES.NOSE_TIP];
      const faceLeft = lm[LANDMARK_INDICES.FACE_LEFT];
      const faceRight = lm[LANDMARK_INDICES.FACE_RIGHT];
      if (!noseTip || !faceLeft || !faceRight) return sum;
      const faceCenterX = (faceLeft.x + faceRight.x) / 2;
      const faceWidth = Math.abs(faceRight.x - faceLeft.x);
      const offset = (noseTip.x - faceCenterX) / faceWidth;
      return sum + Math.pow(offset - avgOffsetX, 2);
    }, 0) / samples.length;
    
    // Set calibrated thresholds
    this.calibrationData = {
      centerX: avgOffsetX,
      centerY: avgOffsetY,
      tolerance: Math.sqrt(varianceX) * 2 + 0.05, // 2 standard deviations + buffer
      eyeContactThreshold: Math.abs(avgOffsetX) + 0.02,
      symmetryThreshold: 0.3,
      baselineSentiment: {
        mouthWidth: samples.reduce((sum, s) => sum + (s.sentiment?.mouthOpenness || 0.15), 0) / samples.length,
        browDistance: samples.reduce((sum, s) => sum + (s.sentiment?.browFurrow || 0.5), 0) / samples.length,
      },
    };
    
    // Update dynamic eye contact threshold
    this.options.EYE_CONTACT_THRESHOLD = Math.max(0.3, 
      Math.min(0.8, 1 - Math.sqrt(varianceX) * 10)
    );
    
    console.log('Calibration results:', this.calibrationData);
  }
  
  _onResults(results) {
    if (!this.isRunning) return;
    
    const timestamp = Date.now();
    let metrics = {
      timestamp,
      questionIndex: this.currentQuestionIndex,
      eyeContactRatio: 0,
      headPoseStability: 1.0,
      isDistracted: false,
      isThinking: false,
      gazeZone: 'unknown',
      sentimentScore: 0.5,
      engagementLevel: 'Low',
      activeListeningNods: this.noddingState.nodCount,
      faceDetected: false,
    };
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      metrics.faceDetected = true;
      
      // Calculate eye contact with calibrated thresholds
      const lookingAtCamera = isLookingAtCamera(landmarks, this.calibrationData);
      const leftEAR = calculateEyeAspectRatio(landmarks, true);
      const rightEAR = calculateEyeAspectRatio(landmarks, false);
      
      // Eye contact ratio based on gaze direction and eye openness
      const avgEAR = (leftEAR + rightEAR) / 2;
      metrics.eyeContactRatio = lookingAtCamera ? 
        Math.min(1.0, avgEAR * 3) : 0.2;
      
      // Calculate head pose
      const pose = estimateHeadPose(landmarks);
      
      // Store pose for stability and nodding calculation
      this.poseHistory.push(pose);
      if (this.poseHistory.length > this.options.STABILITY_WINDOW_SIZE) {
        this.poseHistory.shift();
      }
      
      // Calculate stability (lower variance = higher stability)
      metrics.headPoseStability = this._calculateStability();
      
      // Store eye contact for history
      this.eyeContactHistory.push(metrics.eyeContactRatio);
      if (this.eyeContactHistory.length > this.options.STABILITY_WINDOW_SIZE) {
        this.eyeContactHistory.shift();
      }
      
      // Calculate overall eye contact ratio
      const totalEyeContact = this.eyeContactHistory.reduce((a, b) => a + b, 0);
      metrics.eyeContactRatio = totalEyeContact / this.eyeContactHistory.length;
      
      // ===== INTELLIGENT GAZE CLASSIFICATION =====
      const gazeZone = classifyGazeZone(landmarks, this.calibrationData);
      metrics.gazeZone = gazeZone;
      
      // Track gaze shifts for thinking vs distraction classification
      if (gazeZone !== this.currentGazeZone) {
        if (this.currentGazeZone !== 'center' && this.gazeShiftStart) {
          // Previous gaze shift ended, classify it
          const shiftDuration = timestamp - this.gazeShiftStart;
          this._classifyGazeShift(this.currentGazeZone, shiftDuration);
        }
        this.currentGazeZone = gazeZone;
        this.gazeShiftStart = timestamp;
      }
      
      // Check current gaze state for real-time classification
      if (gazeZone !== 'center' && this.gazeShiftStart) {
        const currentShiftDuration = timestamp - this.gazeShiftStart;
        
        // Check for thinking pattern (up-left or up-right during response)
        if ((gazeZone === 'up-left' || gazeZone === 'up-right') && 
            currentShiftDuration < this.options.THINKING_DURATION_MS) {
          metrics.isThinking = true;
          metrics.isDistracted = false;
        }
        // Check for distraction pattern (down or sideways for too long)
        else if ((gazeZone === 'down' || gazeZone === 'left' || gazeZone === 'right') && 
                 currentShiftDuration > this.options.THINKING_DURATION_MS) {
          metrics.isDistracted = true;
          metrics.isThinking = false;
        }
      }
      
      // ===== SENTIMENT & ACTIVE LISTENER DETECTION =====
      const sentiment = calculateSentiment(landmarks, this.calibrationData.baselineSentiment);
      metrics.sentimentScore = sentiment.sentimentScore;
      metrics.engagementLevel = sentiment.engagementLevel;
      
      // Detect nodding during AI speech
      const isNodding = detectNodding(this.poseHistory, this._isAIPlaying);
      if (isNodding && !this.noddingState.isNodding) {
        this.noddingState.isNodding = true;
        this.noddingState.nodCount++;
        this.sessionData.totalNods++;
      } else if (!isNodding) {
        this.noddingState.isNodding = false;
      }
      metrics.activeListeningNods = this.noddingState.nodCount;
      
    } else {
      // No face detected
      metrics.eyeContactRatio = 0;
      metrics.headPoseStability = 0;
      metrics.engagementLevel = 'Low';
      
      if (!this.currentMetrics.lastLookAwayTime) {
        this.currentMetrics.lastLookAwayTime = timestamp;
      }
      const lookAwayDuration = timestamp - this.currentMetrics.lastLookAwayTime;
      metrics.isDistracted = lookAwayDuration > this.options.DISTRACTION_DURATION_MS;
    }
    
    // Update current metrics with smoothing
    this.currentMetrics = {
      eyeContactRatio: this._smoothValue(
        this.currentMetrics.eyeContactRatio,
        metrics.eyeContactRatio
      ),
      headPoseStability: this._smoothValue(
        this.currentMetrics.headPoseStability,
        metrics.headPoseStability
      ),
      isDistracted: metrics.isDistracted,
      isThinking: metrics.isThinking,
      lastLookAwayTime: this.currentMetrics.lastLookAwayTime,
      gazeZone: metrics.gazeZone,
      sentimentScore: metrics.sentimentScore,
      engagementLevel: metrics.engagementLevel,
      activeListeningNods: metrics.activeListeningNods,
      faceDetected: metrics.faceDetected,
    };
    
    // Store sample
    this.sessionData.samples.push(metrics);
    
    // Store per-question data
    if (this.currentQuestionIndex >= 0) {
      const qKey = `q${this.currentQuestionIndex}`;
      if (!this.sessionData.questionData[qKey]) {
        this.sessionData.questionData[qKey] = {
          samples: [],
          avgEyeContact: 0,
          avgStability: 0,
          distractionCount: 0,
          thinkingCount: 0,
          avgSentimentScore: 0,
        };
      }
      this.sessionData.questionData[qKey].samples.push(metrics);
    }
    
    // Trigger callback
    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(this.currentMetrics);
    }
  }
  
  /**
   * Classify a completed gaze shift
   */
  _classifyGazeShift(gazeZone, duration) {
    // Thinking pattern: brief up-left or up-right glances (memory retrieval cues)
    const isThinkingPattern = (gazeZone === 'up-left' || gazeZone === 'up-right') && 
                              duration < this.options.THINKING_DURATION_MS;
    
    // Distraction pattern: prolonged down or sideways gaze
    const isDistractionPattern = (gazeZone === 'down' || gazeZone === 'left' || gazeZone === 'right') && 
                                 duration > this.options.THINKING_DURATION_MS;
    
    if (isThinkingPattern) {
      console.log(`Thinking pattern detected: ${gazeZone} for ${duration}ms`);
    } else if (isDistractionPattern) {
      console.log(`Distraction pattern detected: ${gazeZone} for ${duration}ms`);
    }
  }
  
  _calculateStability() {
    if (this.poseHistory.length < 2) return 1.0;
    
    let totalVariance = 0;
    const keys = ['pitch', 'yaw', 'roll'];
    
    for (const key of keys) {
      const values = this.poseHistory.map(p => p[key]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      totalVariance += variance;
    }
    
    const avgVariance = totalVariance / keys.length;
    // Convert variance to stability score (0-1, higher is more stable)
    return Math.max(0, Math.min(1, 1 - avgVariance * 10));
  }
  
  _smoothValue(current, newValue) {
    return current * (1 - this.options.SMOOTHING_FACTOR) + 
           newValue * this.options.SMOOTHING_FACTOR;
  }
  
  /**
   * Set AI playing state for active listener detection
   */
  setAIPlayingState(isPlaying) {
    this._isAIPlaying = isPlaying;
  }
  
  /**
   * Start tracking
   */
  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.sessionData.startTime = Date.now();
    this.performanceData.lastFrameTime = performance.now();
    
    // Wait for CDN load to complete before initializing
    await this._initPromise;
    await this.faceMesh.initialize();
    this._processFrame();
  }
  
  /**
   * Stop tracking
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Process video frame with adaptive FPS
   */
  _processFrame() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const frameDelta = currentTime - this.performanceData.lastFrameTime;
    
    // Adaptive FPS: throttle if frame drops detected
    if (frameDelta > this.options.ADAPTIVE_FPS_THRESHOLD) {
      this.performanceData.frameDrops++;
      if (this.performanceData.frameDrops > 10) {
        this.performanceData.adaptiveMode = true;
        // Skip frame processing in adaptive mode
        if (this.performanceData.frameDrops % 3 !== 0) {
          this.animationFrameId = requestAnimationFrame(this._processFrame.bind(this));
          return;
        }
      }
    } else {
      this.performanceData.frameDrops = Math.max(0, this.performanceData.frameDrops - 1);
      if (this.performanceData.frameDrops === 0) {
        this.performanceData.adaptiveMode = false;
      }
    }
    
    this.performanceData.lastFrameTime = currentTime;
    this.performanceData.currentFPS = 1000 / Math.max(frameDelta, 1);
    
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.faceMesh.send({ image: this.video }).catch(err => {
        console.warn('FaceMesh processing error:', err);
      });
    }
    
    this.animationFrameId = requestAnimationFrame(this._processFrame.bind(this));
  }
  
  /**
   * Set current question index for per-question tracking
   */
  setQuestionIndex(index) {
    this.currentQuestionIndex = index;
  }
  
  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    return { ...this.currentMetrics };
  }
  
  /**
   * Get calibration status
   */
  getCalibrationStatus() {
    return {
      isCalibrated: this.isCalibrated,
      calibrationData: this.calibrationData,
    };
  }
  
  /**
   * Get session data for reporting (enhanced with sentiment and active listening)
   */
  getSessionReport() {
    const report = {
      totalDuration: Date.now() - this.sessionData.startTime,
      totalSamples: this.sessionData.samples.length,
      overallEyeContact: 0,
      overallStability: 0,
      totalDistractionTime: 0,
      totalThinkingTime: 0,
      questionBreakdown: {},
      // New metrics for enhanced behavioral analysis
      sentimentScore: 0,
      activeListeningNods: this.sessionData.totalNods,
      engagementLevel: 'Low',
      gazeZoneDistribution: {
        center: 0,
        left: 0,
        right: 0,
        'up-left': 0,
        'up-right': 0,
        down: 0,
        unknown: 0,
      },
    };
    
    // Calculate overall metrics
    if (this.sessionData.samples.length > 0) {
      report.overallEyeContact = 
        this.sessionData.samples.reduce((sum, s) => sum + s.eyeContactRatio, 0) / 
        this.sessionData.samples.length;
      
      report.overallStability = 
        this.sessionData.samples.reduce((sum, s) => sum + s.headPoseStability, 0) / 
        this.sessionData.samples.length;
      
      report.totalDistractionTime = 
        this.sessionData.samples.filter(s => s.isDistracted).length * 
        this.options.SAMPLE_INTERVAL_MS;
      
      report.totalThinkingTime = 
        this.sessionData.samples.filter(s => s.isThinking).length * 
        this.options.SAMPLE_INTERVAL_MS;
      
      report.sentimentScore = 
        this.sessionData.samples.reduce((sum, s) => sum + (s.sentimentScore || 0.5), 0) / 
        this.sessionData.samples.length;
      
      // Calculate dominant engagement level
      const engagementCounts = { Low: 0, Medium: 0, High: 0 };
      this.sessionData.samples.forEach(s => {
        engagementCounts[s.engagementLevel || 'Low']++;
      });
      report.engagementLevel = Object.entries(engagementCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Calculate gaze zone distribution
      this.sessionData.samples.forEach(s => {
        const zone = s.gazeZone || 'unknown';
        if (report.gazeZoneDistribution.hasOwnProperty(zone)) {
          report.gazeZoneDistribution[zone]++;
        }
      });
    }
    
    // Per-question breakdown
    for (const [key, data] of Object.entries(this.sessionData.questionData)) {
      if (data.samples.length > 0) {
        report.questionBreakdown[key] = {
          avgEyeContact: 
            data.samples.reduce((sum, s) => sum + s.eyeContactRatio, 0) / data.samples.length,
          avgStability:
            data.samples.reduce((sum, s) => sum + s.headPoseStability, 0) / data.samples.length,
          distractionCount: data.samples.filter(s => s.isDistracted).length,
          thinkingCount: data.samples.filter(s => s.isThinking).length,
          avgSentimentScore:
            data.samples.reduce((sum, s) => sum + (s.sentimentScore || 0.5), 0) / data.samples.length,
          sampleCount: data.samples.length,
        };
      }
    }
    
    return report;
  }
  
  /**
   * Reset session data
   */
  reset() {
    this.sessionData = {
      samples: [],
      startTime: null,
      questionData: {},
      totalNods: 0,
      avgSentimentScore: 0,
    };
    this.poseHistory = [];
    this.eyeContactHistory = [];
    this.gazeHistory = [];
    this.currentQuestionIndex = -1;
    this.currentGazeZone = 'center';
    this.gazeShiftStart = null;
    this.noddingState = {
      isNodding: false,
      nodCount: 0,
      lastNodTime: 0,
    };
    this.currentMetrics = {
      eyeContactRatio: 0,
      headPoseStability: 1.0,
      isDistracted: false,
      isThinking: false,
      lastLookAwayTime: null,
      gazeZone: 'unknown',
      sentimentScore: 0.5,
      engagementLevel: 'Low',
      activeListeningNods: 0,
      faceDetected: false,
    };
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    this.stop();
    if (this.faceMesh) {
      this.faceMesh.close();
    }
  }
}

/**
 * Hook-friendly function to create and manage PrismTracker
 * Can be used with React hooks
 */
export function createPrismTracker(videoElement, callbacks = {}) {
  const tracker = new PrismTracker(videoElement, callbacks);
  return tracker;
}

export default PrismTracker;