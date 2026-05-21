# ElevenLabs Integration Setup Guide

## Overview
This guide will help you configure the ElevenLabs API for high-fidelity AI voice in the AIRA platform.

## Prerequisites
1. An ElevenLabs account (sign up at [elevenlabs.io](https://elevenlabs.io))
2. An active subscription (free tier available with limited characters)

## Step 1: Get Your API Key

1. Log in to your ElevenLabs dashboard
2. Click on your profile icon in the top right
3. Select "Profile" or go directly to [Profile Settings](https://elevenlabs.io/app/settings/profile)
4. Find the "API Keys" section
5. Click "Create API Key" or copy your existing key

## Step 2: Configure Environment Variables

### Backend (.env file)
```env
ELEVEN_LABS_API_KEY=your_api_key_here
```

**Important:** Never commit your API key to version control. The `.env` file is already in `.gitignore`.

## Step 3: Voice Configuration

The system is pre-configured with professional voice settings:

### Default Voice: "Adam"
- Voice ID: `pNInz6obpgDQGcFmaJgB`
- Characteristics: Professional, clear, neutral male voice
- Ideal for: Interview questions, formal content

### Alternative Voices Available:
You can modify the voice configuration in `server/services/ttsService.js`:

```javascript
this.voiceConfig = {
  interviewer: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam (default)
    // voiceId: 'AZnzlk1XvdvUeBnXmlld', // Callum (alternative)
    // voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel (female)
    // voiceId: 'AZnzlk1XvdvUeBnXmlld', // Callum (British male)
    name: 'Adam'
  }
};
```

### Voice Settings:
- **Stability**: 0.5 (balanced consistency vs. expressiveness)
- **Similarity Boost**: 0.75 (voice character preservation)
- **Style**: 0.0 (neutral delivery)
- **Speaker Boost**: Enabled (enhanced clarity)

## Step 4: Testing the Integration

### Test via API
```bash
# Start your server
cd server
npm start

# Test the TTS service
curl -X POST http://localhost:5000/api/interview/cache/stats
```

### Test via Interview
1. Start the application
2. Create a new interview
3. Select "High-Fidelity AI Voice" in the voice quality settings
4. Begin the interview
5. The system should automatically play questions using ElevenLabs voice

## Step 5: Caching System

The system automatically caches generated audio files to:
- Reduce API calls
- Save credits
- Improve response times for repeated questions

### Cache Location
- Path: `server/cache/audio/`
- Format: MP4 (mp4_44100_128)
- Naming: MD5 hash of text + voice ID

### Cache Management
```javascript
// View cache statistics
GET /api/interview/cache/stats

// Clear cache (use sparingly)
DELETE /api/interview/cache/clear
```

## Troubleshooting

### Common Issues

1. **"API Key Invalid" Error**
   - Verify your API key in the ElevenLabs dashboard
   - Ensure there are no extra spaces in the .env file
   - Restart the server after updating .env

2. **"Quota Exceeded" Error**
   - Check your ElevenLabs subscription limits
   - The free tier includes 10,000 characters/month
   - Consider upgrading your plan for higher limits

3. **"Audio Playback Failed"**
   - Check browser console for errors
   - Verify the audio file format is supported
   - Try falling back to standard voice

4. **High Latency**
   - ElevenLabs generation takes 2-5 seconds for typical questions
   - The system pre-generates audio when possible
   - Consider using cached audio for common questions

### Fallback Mechanism

If ElevenLabs fails, the system automatically falls back to the browser's standard speech synthesis:

```javascript
// Automatic fallback in useVoice.js
try {
  await playAudio(audioUrl, onEnd);
} catch (error) {
  console.warn('ElevenLabs audio failed, falling back to standard voice');
  speakStandard(text, onEnd);
}
```

## Performance Optimization

### Pre-generation Strategy
The system pre-generates audio for:
- Current question (on load)
- Next question (while candidate answers current)

This reduces perceived latency and improves user experience.

### Bandwidth Considerations
- Audio format: MP4 at 44.1kHz, 128kbps
- Average file size: ~50-100KB per minute of audio
- Typical question (30 seconds): ~25-50KB

## Cost Management

### Character Counting
- English text: ~1 character = 1 character
- Average question (100 words): ~500-600 characters
- 10-question interview: ~5,000-6,000 characters

### Free Tier Limits
- 10,000 characters/month
- Approximately 15-20 interviews per month

### Paid Plans
- Starter: $5/month for 30,000 characters
- Creator: $22/month for 100,000 characters
- Pro: $99/month for 500,000 characters

## Security Notes

1. **API Key Protection**
   - Never expose API keys in client-side code
   - All ElevenLabs calls go through the backend
   - API key is stored securely in environment variables

2. **Rate Limiting**
   - ElevenLabs has built-in rate limits
   - The caching system helps reduce API calls
   - Monitor usage in your ElevenLabs dashboard

## Support

For ElevenLabs-specific issues:
- Documentation: [docs.elevenlabs.io](https://docs.elevenlabs.io)
- Support: support@elevenlabs.io
- Discord Community: [ElevenLabs Discord](https://discord.gg/elevenlabs)

For AIRA integration issues:
- Check the application logs
- Verify environment configuration
- Test with standard voice first