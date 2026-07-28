// generateVoice.js
// Converts script text into voiceover MP3 using Edge TTS
// Settings are NOT locked - pass them as arguments to test different combos

const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Defaults - can be overridden via command line
const DEFAULT_VOICE = 'en-US-AndrewNeural';
const DEFAULT_RATE = '+0%';
const DEFAULT_PITCH = '+0Hz';

async function generateVoice(scriptPath, options = {}) {
  const voice = options.voice || DEFAULT_VOICE;
  const rate = options.rate || DEFAULT_RATE;
  const pitch = options.pitch || DEFAULT_PITCH;
  const outputName = options.outputName;

  console.log(`\nGenerating voiceover from: ${scriptPath}`);
  console.log(`Voice: ${voice} | Rate: ${rate} | Pitch: ${pitch}\n`);

  // Read the script text
  const scriptText = await fs.readFile(scriptPath, 'utf-8');

  // Clean the text - remove markdown, stage directions, SSML tags
  // that might confuse the TTS engine
  const cleanText = scriptText
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/<break.*?\/>/g, '')
    .replace(/<emphasis.*?>|<\/emphasis>/g, '')
    .trim();

  // Save cleaned text to a temp file (edge-tts reads better from file for long text)
  await fs.ensureDir('output');
  const tempTextFile = 'output/temp_voice_input.txt';
  await fs.writeFile(tempTextFile, cleanText);

  // Determine output filename
  const fileName = outputName || `voice_${Date.now()}.mp3`;
  const outputPath = path.join('output', fileName);

  // Build the edge-tts command
  const command = `python -m edge_tts --voice ${voice} --rate="${rate}" --pitch="${pitch}" --file "${tempTextFile}" --write-media "${outputPath}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error generating voice:', error.message);
        reject(error);
        return;
      }

      console.log('Voiceover generated successfully!');
      console.log(`Saved to: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

// Parse command line arguments
// Usage: node generateVoice.js "path/to/script.txt" [voice] [rate] [pitch] [outputName]
const scriptPath = process.argv[2];
const voice = process.argv[3];
const rate = process.argv[4];
const pitch = process.argv[5];
const outputName = process.argv[6];

if (!scriptPath) {
  console.log('Usage: node generateVoice.js "path/to/script.txt" [voice] [rate] [pitch] [outputName]');
  console.log('Example: node generateVoice.js output/script_123.txt en-US-GuyNeural +10% -5Hz test.mp3');
  console.log('Example (defaults): node generateVoice.js output/script_123.txt');
  process.exit(1);
}

generateVoice(scriptPath, { voice, rate, pitch, outputName });