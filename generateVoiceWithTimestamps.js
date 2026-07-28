// generateVoiceWithTimestamps.js
// Generates voiceover MP3 AND captures exact sentence-level timestamps
// Uses SentenceBoundary events (confirmed working on this edge-tts version)

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const DEFAULT_VOICE = 'en-US-AndrewNeural';
const DEFAULT_RATE = '+0%';
const DEFAULT_PITCH = '+0Hz';

async function generateVoiceWithTimestamps(scriptPath, options = {}) {
  const voice = options.voice || DEFAULT_VOICE;
  const rate = options.rate || DEFAULT_RATE;
  const pitch = options.pitch || DEFAULT_PITCH;
  const outputName = options.outputName || `voice_${Date.now()}`;

  console.log(`\nGenerating voiceover with timestamps from: ${scriptPath}`);
  console.log(`Voice: ${voice} | Rate: ${rate} | Pitch: ${pitch}\n`);

  const scriptText = await fs.readFile(scriptPath, 'utf-8');
  const cleanText = scriptText
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/<break.*?\/>/g, '')
    .replace(/<emphasis.*?>|<\/emphasis>/g, '')
    .trim();

  await fs.ensureDir('output');
  const tempTextFile = 'output/temp_voice_input.txt';
  await fs.writeFile(tempTextFile, cleanText);

  const audioPath = path.join('output', `${outputName}.mp3`);
  const timestampPath = path.join('output', `${outputName}_sentences.json`);

  const pythonScript = `
import asyncio
import edge_tts
import json

async def main():
    text = open("${tempTextFile.replace(/\\/g, '/')}", "r", encoding="utf-8").read()
    voice = "${voice}"
    rate = "${rate}"
    pitch = "${pitch}"
    
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    
    sentence_boundaries = []
    
    with open("${audioPath.replace(/\\/g, '/')}", "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "SentenceBoundary":
                sentence_boundaries.append({
                    "text": chunk["text"],
                    "offset_ms": chunk["offset"] / 10000,
                    "duration_ms": chunk["duration"] / 10000
                })
    
    with open("${timestampPath.replace(/\\/g, '/')}", "w", encoding="utf-8") as f:
        json.dump(sentence_boundaries, f, indent=2)
    
    print(f"Generated {len(sentence_boundaries)} sentence timestamps")

asyncio.run(main())
`;

  const tempPyFile = 'output/temp_generate_voice.py';
  await fs.writeFile(tempPyFile, pythonScript);

  return new Promise((resolve, reject) => {
    const proc = spawn('python', [tempPyFile]);

    proc.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });

    proc.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
        return;
      }

      console.log('\nVoiceover generated successfully!');
      console.log(`Audio: ${audioPath}`);
      console.log(`Timestamps: ${timestampPath}`);

      resolve({ audioPath, timestampPath });
    });
  });
}

const scriptPath = process.argv[2];
const voice = process.argv[3];
const rate = process.argv[4];
const pitch = process.argv[5];
const outputName = process.argv[6];

if (!scriptPath) {
  console.log('Usage: node generateVoiceWithTimestamps.js "path/to/script.txt" [voice] [rate] [pitch] [outputName]');
  process.exit(1);
}

generateVoiceWithTimestamps(scriptPath, { voice, rate, pitch, outputName });