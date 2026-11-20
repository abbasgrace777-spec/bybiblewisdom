const path = require('node:path');
const WebSocket = require(path.join(__dirname, '../../backend/node_modules/ws'));
const fs = require('node:fs');
const crypto = require('node:crypto');

function getSecMsGec() {
  const S_TO_TICKS = 10000000;
  const EPOCH_OFFSET = 11644473600; // seconds from 1601 to 1970
  const now = Math.floor(Date.now() / 1000);
  const ticks = (now + EPOCH_OFFSET) * S_TO_TICKS;
  const roundedTicks = ticks - (ticks % (300 * S_TO_TICKS));
  const str = `${roundedTicks}6A5AA1D4EA6340818367A62888481E77`;
  return crypto.createHash('sha256').update(str).digest('hex').toUpperCase();
}

function generateEdgeTTS(text, voice = 'en-US-ChristopherNeural', rate = '-5%', pitch = '+0Hz') {
  return new Promise((resolve, reject) => {
    const trustedToken = '6A5AA1D4EA6340818367A62888481E77';
    const connectionId = crypto.randomUUID().replace(/-/g, '');
    const secMsGec = getSecMsGec();
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${trustedToken}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-130.0.2849.68&ConnectionId=${connectionId}`;

    const ws = new WebSocket(wsUrl, {
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0'
      }
    });

    const audioChunks = [];
    const wordTimings = [];
    const requestId = crypto.randomUUID().replace(/-/g, '');

    ws.on('open', () => {
      // 1. Send speech.config
      const configMsg = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: "false",
                  wordBoundaryEnabled: "true"
                },
                outputFormat: "audio-24khz-48kbitrate-mono-mp3"
              }
            }
          }
        });
      ws.send(configMsg);

      // 2. Send SSML request
      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
        `<voice name='${voice}'>` +
        `<prosody pitch='${pitch}' rate='${rate}'>${escapedText}</prosody>` +
        `</voice></speak>`;

      const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMsg);
    });

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        // Find binary separator 0x00 0x00
        const headerLen = data.readUInt16BE(0);
        const audioData = data.subarray(headerLen + 2);
        if (audioData.length > 0) {
          audioChunks.push(audioData);
        }
      } else {
        const textStr = data.toString('utf8');
        if (textStr.includes('Path:audio.metadata')) {
          try {
            const bodyIdx = textStr.indexOf('\r\n\r\n');
            if (bodyIdx !== -1) {
              const metaJson = JSON.parse(textStr.substring(bodyIdx + 4));
              if (metaJson.Metadata) {
                for (const item of metaJson.Metadata) {
                  if (item.Type === 'WordBoundary') {
                    wordTimings.push({
                      offset: item.Data.Offset / 10000, // in ms
                      duration: item.Data.Duration / 10000,
                      text: item.Data.text.Text
                    });
                  }
                }
              }
            }
          } catch (e) {
            // Ignore parse errors on ping/pong frames
          }
        } else if (textStr.includes('Path:turn.end')) {
          ws.close();
          const finalBuffer = Buffer.concat(audioChunks);
          resolve({
            audioBuffer: finalBuffer,
            wordTimings,
            durationMs: wordTimings.length > 0 
              ? wordTimings[wordTimings.length - 1].offset + wordTimings[wordTimings.length - 1].duration 
              : 0
          });
        }
      }
    });

    ws.on('error', (err) => {
      reject(err);
    });
  });
}

// Quick test
console.log('Testing Edge-TTS synthesizer...');
generateEdgeTTS('In the beginning, God created the heavens and the earth.')
  .then(res => {
    console.log(`[PASS] TTS Generated: Buffer size=${res.audioBuffer.length} bytes, Word timings=${res.wordTimings.length}`);
    fs.writeFileSync('D:\\bible\\storage\\temp\\test_narration.mp3', res.audioBuffer);
    console.log('[PASS] Saved sample audio to D:\\bible\\storage\\temp\\test_narration.mp3');
    process.exit(0);
  })
  .catch(err => {
    console.error('TTS test failed:', err);
    process.exit(1);
  });
