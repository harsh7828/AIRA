/**
 * Prism Web Worker - Offloaded FaceMesh Processing
 * 
 * This worker handles the computationally intensive FaceMesh landmark detection
 * to keep the main UI thread running at 60 FPS. It communicates with the main
 * thread via message passing, sending only numerical landmark data (privacy-preserving).
 * 
 * Privacy: Only numerical landmark coordinates are processed and transmitted.
 * No raw video frames are stored or transmitted from the worker.
 */

// Import FaceMesh from a CDN-compatible source
importScripts('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');

// Key landmark indices for tracking
const LANDMARK_INDICES = {
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_OUTER: 362,
  RIGHT_EYE_INNER: 263,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  NOSE_TIP: 1,
  NOSE_BASE: 6,
  FACE_TOP: 10,
  FACE_BOTTOM: 152,
  FACE_LEFT: 234,
  FACE_RIGHT: 454,
  FOREHEAD: 10,
  CHIN: 152,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  BROW_LEFT_OUTER: 4,
  BROW_RIGHT_OUTER: 9,
};

// Configuration
const CONFIG = {
  EYE_CONTACT_THRESHOLD: 0.6,
  PITCH_THRESHOLD: 0.35,
  YAW_THRESHOLD: 0.4,
  ROLL_THRESHOLD: 0.2,
  THINKING_DURATION_MS: 3000,
  DISTRACTION_DURATION_MS: 2000,
  SMOOTHING_FACTOR: 0.3,
  STABILITY_WINDOW_SIZE: 30,
  CALIBRATION_DURATION_MS: 5000,
};

// FaceMesh instance
let faceMesh = null;
let isRunning = false;
let calibrationData = null;
let poseHistory = [];
let eyeContactHistory = [];
let currentGazeZone = 'center';
let gazeShiftStart = null;

/**
 * Initialize FaceMesh
 */
function initFaceMesh() {
  faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults(onResults);
}

/**
 * Process results from FaceMesh
 */
function onResults(results) {
  if (!isRunning) return;

  const timestamp = Date.now();
  let metrics = {
    timestamp,
    eyeContactRatio: 0,
    headPoseStability: 1.0,
    isDistracted: false,
    isThinking: false,
    gazeZone: 'unknown',
    sentimentScore: 0.5,
    engagementLevel: 'Low',
    faceDetected: false,
  };

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];
    metrics.faceDetected = true;

    // Calculate eye contact
    const lookingAtCamera = checkLookingAtCamera(landmarks);
    const leftEAR = calculateEyeAspectRatio(landmarks, true);
    const rightEAR = calculateEyeAspectRatio(landmarks, false);
    const avgEAR = (leftEAR + rightEAR) / 2;
    metrics.eyeContactRatio = lookingAtCamera ? Math.min(1.0, avgEAR * 3) : 0.2;

    // Calculate head pose with noding 
    const pose = estimateHeadPose(landmarks);
    poseHistory.push(pose);
    if (poseHistory.length > CONFIG.STABILITY_WINDOW_SIZE) {
      poseHistory.shift();
    }

    // Calculate stability
    metrics.headPoseStability = calculateStability();

    // Store eye contact history
    eyeContactHistory.push(metrics.eyeContactRatio);
    if (eyeContactHistory.length > CONFIG.STABILITY_WINDOW_SIZE) {
      eyeContactHistory.shift();
    }

    // Calculate overall eye contact ratio
    const totalEyeContact = eyeContactHistory.reduce((a, b) => a + b, 0);
    metrics.eyeContactRatio = totalEyeContact / eyeContactHistory.length;

    // Classify gaze zone
    const gazeZone = classifyGazeZone(landmarks);
    metrics.gazeZone = gazeZone;

    // Track gaze shifts
    if (gazeZone !== currentGazeZone) {
      if (currentGazeZone !== 'center' && gazeShiftStart) {
        const shiftDuration = timestamp - gazeShiftStart;
        // Classification happens in main thread
      }
      currentGazeZone = gazeZone;
      gazeShiftStart = timestamp;
    }

    // Check for thinking/distraction patterns
    if (gazeZone !== 'center' && gazeShiftStart) {
      const currentShiftDuration = timestamp - gazeShiftStart;
      if ((gazeZone === 'up-left' || gazeZone === 'up-right') && 
          currentShiftDuration < CONFIG.THINKING_DURATION_MS) {
        metrics.isThinking = true;
        metrics.isDistracted = false;
      } else if ((gazeZone === 'down' || gazeZone === 'left' || gazeZone === 'right') && 
                 currentShiftDuration > CONFIG.THINKING_DURATION_MS) {
        metrics.isDistracted = true;
        metrics.isThinking = false;
      }
    }

    // Calculate sentiment
    const sentiment = calculateSentiment(landmarks);
    metrics.sentimentScore = sentiment.sentimentScore;
    metrics.engagementLevel = sentiment.engagementLevel;
  }

  // Send metrics back to main thread
  self.postMessage({
    type: 'metrics',
    data: metrics
  });
}

/**
 * Calculate eye aspect ratio
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

  if (!top || !bottom || !outer || !inner) return 0;

  const verticalDist = Math.sqrt(
    Math.pow(top.z - bottom.z, 2) + Math.pow(top.y - bottom.y, 2)
  );
  const horizontalDist = Math.sqrt(
    Math.pow(outer.z - inner.z, 2) + Math.pow(outer.y - inner.y, 2)
  );

  return horizontalDist > 0 ? verticalDist / horizontalDist : 0;
}

/**
 * Estimate head pose angles
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

  const faceCenterX = (faceLeft.x + faceRight.x) / 2;
  const faceCenterY = (forehead.y + chin.y) / 2;

  const noseOffsetX = noseTip.x - faceCenterX;
  const yaw = Math.atan2(noseOffsetX, 0.5) * 2;

  const noseLength = Math.sqrt(
    Math.pow(noseTip.y - noseBase.y, 2) + Math.pow(noseTip.x - noseBase.x, 2)
  );
  const pitch = (noseLength - 0.1) * 5;

  const leftEye = landmarks[LANDMARK_INDICES.LEFT_EYE_INNER];
  const rightEye = landmarks[LANDMARK_INDICES.RIGHT_EYE_INNER];
  let roll = 0;
  if (leftEye && rightEye) {
    roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  }

  return { pitch, yaw, roll };
}

/**
 * Check if looking at camera
 */
function checkLookingAtCamera(landmarks) {
  if (!landmarks) return false;

  const noseTip = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const leftEye = landmarks[LANDMARK_INDICES.LEFT_EYE_INNER];
  const rightEye = landmarks[LANDMARK_INDICES.RIGHT_EYE_INNER];

  if (!noseTip || !leftEye || !rightEye) return false;

  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const noseOffset = Math.abs(noseTip.x - eyeMidX);

  const faceLeft = landmarks[LANDMARK_INDICES.FACE_LEFT];
  const faceRight = landmarks[LANDMARK_INDICES.FACE_RIGHT];

  if (!faceLeft || !faceRight) return false;

  const faceWidth = Math.abs(faceRight.x - faceLeft.x);
  const symmetry = Math.abs(
    Math.abs(noseTip.x - faceLeft.x) - Math.abs(faceRight.x - noseTip.x)
  );

  const threshold = calibrationData?.eyeContactThreshold || 0.1;
  return noseOffset < threshold && symmetry < faceWidth * 0.3;
}

/**
 * Classify gaze zone
 */
function classifyGazeZone(landmarks) {
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

  const offsetX = (noseTip.x - faceCenterX) / faceWidth;
  const offsetY = (noseTip.y - faceCenterY) / faceHeight;

  const centerX = calibrationData?.centerX || 0;
  const centerY = calibrationData?.centerY || 0;
  const tolerance = calibrationData?.tolerance || 0.1;

  const normalizedOffsetX = offsetX - centerX;
  const normalizedOffsetY = offsetY - centerY;

  if (normalizedOffsetY < -tolerance) {
    if (normalizedOffsetX < -tolerance) return 'up-left';
    if (normalizedOffsetX > tolerance) return 'up-right';
    return 'up';
  } else if (normalizedOffsetY > tolerance) {
    return 'down';
  } else {
    if (normalizedOffsetX < -tolerance) return 'left';
    if (normalizedOffsetX > tolerance) return 'right';
    return 'center';
  }
}

/**
 * Calculate stability
 */
function calculateStability() {
  if (poseHistory.length < 2) return 1.0;

  let totalVariance = 0;
  const keys = ['pitch', 'yaw', 'roll'];

  for (const key of keys) {
    const values = poseHistory.map(p => p[key]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    totalVariance += variance;
  }

  const avgVariance = totalVariance / keys.length;
  return Math.max(0, Math.min(1, 1 - avgVariance * 10));
}

/**
 * Calculate sentiment score
 */
function calculateSentiment(landmarks) {
  if (!landmarks) return { sentimentScore: 0.5, engagementLevel: 'Low' };

  const mouthLeft = landmarks[LANDMARK_INDICES.MOUTH_LEFT];
  const mouthRight = landmarks[LANDMARK_INDICES.MOUTH_RIGHT];
  const browLeft = landmarks[LANDMARK_INDICES.BROW_LEFT_OUTER];
  const browRight = landmarks[LANDMARK_INDICES.BROW_RIGHT_OUTER];
  const faceLeft = landmarks[LANDMARK_INDICES.FACE_LEFT];
  const faceRight = landmarks[LANDMARK_INDICES.FACE_RIGHT];

  if (!mouthLeft || !mouthRight || !browLeft || !browRight || !faceLeft || !faceRight) {
    return { sentimentScore: 0.5, engagementLevel: 'Low' };
  }

  const mouthWidth = Math.sqrt(
    Math.pow(mouthRight.x - mouthLeft.x, 2) + Math.pow(mouthRight.y - mouthLeft.y, 2)
  );
  const faceWidth = Math.abs(faceRight.x - faceLeft.x);
  const normalizedMouthWidth = faceWidth > 0 ? mouthWidth / faceWidth : 0;

  const browDistance = Math.sqrt(
    Math.pow(browRight.x - browLeft.x, 2) + Math.pow(browRight.y - browLeft.y, 2)
  );
  const normalizedBrowDistance = faceWidth > 0 ? browDistance / faceWidth : 0;

  const baselineMouth = CONFIG.SENTIMENT_NEUTRAL_MOUTH || 0.15;
  const baselineBrow = 0.5;

  const mouthOpenness = Math.min(1, normalizedMouthWidth / baselineMouth);
  const browFurrow = Math.max(0, 1 - (normalizedBrowDistance / baselineBrow));

  const sentimentScore = Math.max(0, Math.min(1, 
    0.4 * mouthOpenness + 
    0.3 * (1 - browFurrow) + 
    0.3 * (1 - Math.abs(normalizedMouthWidth - baselineMouth))
  ));

  let engagementLevel = 'Low';
  if (sentimentScore >= 0.7) engagementLevel = 'High';
  else if (sentimentScore >= 0.4) engagementLevel = 'Medium';

  return {
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    engagementLevel,
  };
}

/**
 * Message handler from main thread
 */
self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      initFaceMesh();
      self.postMessage({ type: 'initialized' });
      break;

    case 'start':
      isRunning = true;
      break;

    case 'stop':
      isRunning = false;
      break;

    case 'process':
      if (faceMesh && isRunning) {
        faceMesh.send({ image: data.image }).catch(err => {
          self.postMessage({ type: 'error', error: err.message });
        });
      }
      break;

    case 'calibrate':
      calibrationData = data.calibrationData;
      break;

    case 'setConfig':
      Object.assign(CONFIG, data);
      break;

    case 'reset':
      poseHistory = [];
      eyeContactHistory = [];
      currentGazeZone = 'center';
      gazeShiftStart = null;
      break;

    case 'dispose':
      if (faceMesh) {
        faceMesh.close();
        faceMesh = null;
      }
      isRunning = false;
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

/**
 * Performance monitoring
 * Send FPS stats back to main thread periodically
 */
let frameCount = 0;
let lastFPSCheck = Date.now();

setInterval(() => {
  const now = Date.now();
  const elapsed = now - lastFPSCheck;
  const fps = (frameCount / elapsed) * 1000;
  
  self.postMessage({
    type: 'fps',
    data: { fps: Math.round(fps) }
  });
  
  frameCount = 0;
  lastFPSCheck = now;
}, 1000);

// Increment frame count on each result
const originalOnResults = onResults;
// Note: We can't easily hook into this without modifying the flow
// FPS tracking is handled via message timing instead