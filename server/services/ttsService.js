import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TTSService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    
    // Voice configuration
    this.voiceConfig = {
      // Professional male voice - "Adam"
      interviewer: {
        voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam (professional male)
        name: 'Adam'
      },
      // You can add more voices here
      default: {
        voiceId: 'pNInz6obpgDQGcFmaJgB',
        name: 'Adam'
      }
    };
    
    // Model configuration
    this.modelId = 'eleven_multilingual_v2';
    
    // Voice settings for consistent, expressive tone
    this.voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    };
    
    // Output format - balance between quality and bandwidth
    this.outputFormat = 'mp3_44100_128';
    
    // Cache directory
    this.cacheDir = path.join(__dirname, '../cache/audio');
    this.ensureCacheDirectory();
    
    // Cache map to store file paths
    this.cache = new Map();
    
    // Load existing cache on startup
    this.loadCacheFromDisk();
  }
  
  ensureCacheDirectory() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
  
  generateCacheKey(text, voiceId) {
    const key = `${text}_${voiceId}_${this.modelId}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }
  
  loadCacheFromDisk() {
    try {
      if (fs.existsSync(this.cacheDir)) {
        const files = fs.readdirSync(this.cacheDir);
        files.forEach(file => {
          if (file.endsWith('.mp3')) {
            const cacheKey = file.replace('.mp3', '');
            const filePath = path.join(this.cacheDir, file);
            this.cache.set(cacheKey, filePath);
          }
        });
        console.log(`Loaded ${this.cache.size} cached audio files`);
      }
    } catch (error) {
      console.error('Error loading cache from disk:', error);
    }
  }
  
  async textToSpeech(text, voiceType = 'interviewer', options = {}) {
    const voice = this.voiceConfig[voiceType] || this.voiceConfig.default;
    const cacheKey = this.generateCacheKey(text, voice.voiceId);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cachedPath = this.cache.get(cacheKey);
      if (fs.existsSync(cachedPath)) {
        console.log(`Returning cached audio for text: "${text.substring(0, 50)}..."`);
        return {
          audioPath: cachedPath,
          cached: true,
          format: 'mp3'
        };
      }
    }
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voice.voiceId}`,
        {
          text: text,
          model_id: this.modelId,
          voice_settings: this.voiceSettings,
          output_format: this.outputFormat
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      
      // Save to cache
      const audioBuffer = Buffer.from(response.data);
      const cacheFilePath = path.join(this.cacheDir, `${cacheKey}.mp3`);
      fs.writeFileSync(cacheFilePath, audioBuffer);
      this.cache.set(cacheKey, cacheFilePath);
      
      console.log(`Generated and cached audio for text: "${text.substring(0, 50)}..."`);
      
      return {
        audioPath: cacheFilePath,
        cached: false,
        format: 'mp3',
        duration: this.estimateDuration(text)
      };
      
    } catch (error) {
      // responseType:'arraybuffer' means error bodies also come back as Buffers.
      // Decode to JSON so the log is human-readable.
      let apiErrorDetail = null;
      if (error.response?.data) {
        try {
          const decoded = JSON.parse(Buffer.from(error.response.data).toString('utf-8'));
          apiErrorDetail = decoded?.detail;
        } catch (_) {
          apiErrorDetail = null;
        }
      }

      const httpStatus = error.response?.status;
      const readableMsg = typeof apiErrorDetail === 'object'
        ? `ElevenLabs [${httpStatus}]: ${apiErrorDetail?.status || JSON.stringify(apiErrorDetail)}`
        : apiErrorDetail || error.message;

      console.error(`ElevenLabs API Error [${httpStatus}]:`, readableMsg);

      const err = new Error(readableMsg);
      err.status   = httpStatus;
      err.fallback = true;
      throw err;
    }
  }
  
  estimateDuration(text) {
    // Average speaking rate: ~150 words per minute
    const words = text.split(/\s+/).length;
    const minutes = words / 150;
    return Math.ceil(minutes * 60 * 1000); // Return in milliseconds
  }
  
  async getVoices() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/voices`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );
      
      return response.data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error.message);
      return [];
    }
  }
  
  clearCache() {
    try {
      if (fs.existsSync(this.cacheDir)) {
        const files = fs.readdirSync(this.cacheDir);
        files.forEach(file => {
          const filePath = path.join(this.cacheDir, file);
          fs.unlinkSync(filePath);
        });
        this.cache.clear();
        console.log('TTS cache cleared');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
  
  getCacheStats() {
    let totalSize = 0;
    let fileCount = 0;
    
    try {
      if (fs.existsSync(this.cacheDir)) {
        const files = fs.readdirSync(this.cacheDir);
        files.forEach(file => {
          const filePath = path.join(this.cacheDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
          fileCount++;
        });
      }
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }
    
    return {
      fileCount,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  }
}

const ttsService = new TTSService();
export default ttsService;