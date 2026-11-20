const path = require('node:path');
const { MsEdgeTTS, OUTPUT_FORMAT } = require(path.join(__dirname, '../../backend/node_modules/msedge-tts'));
const fs = require('node:fs');

async function test() {
  const tts = new MsEdgeTTS();
  await tts.setMetadata("en-US-ChristopherNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  
  const outputDir = 'D:\\bible\\storage\\temp';
  console.log('[Test] Synthesizing speech to directory:', outputDir);
  
  await tts.toFile(outputDir, "In the beginning, God created the heavens and the earth.");
  console.log('[PASS] toFile completed.');
  
  const mp3Path = path.join(outputDir, 'audio.mp3');
  const stat = fs.statSync(mp3Path);
  console.log(`[PASS] Audio generated successfully! File: ${mp3Path}, Size: ${stat.size} bytes`);
}

test().catch(err => console.error('Error:', err));
