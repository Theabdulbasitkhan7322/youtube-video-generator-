// stage2_parseScript.js
// Takes raw Beyond Obvious script → breaks into timed narration segments
// Output: JSON array of {narration, estimatedDuration}

require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs-extra');

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

const PARSE_PROMPT = `
You are a video editor breaking a narration script into scenes.

RULES:
1. Split the script into natural visual segments
2. Each segment should be one complete thought/action
3. Segments should be 2-6 seconds of narration each
4. Keep narration exactly as written — do not modify words
5. Estimate duration based on speaking pace: 3 words per second
6. Number the scenes sequentially

Return ONLY valid JSON in this exact format:
{
  "topic": "original topic",
  "format": "SHORT or LONG",
  "scenes": [
    {
      "sceneNumber": 1,
      "narration": "exact words from script",
      "estimatedDurationSeconds": 3.5,
      "emotionalTone": "wonder|dread|reflection|surprise"
    }
  ]
}

Speaking pace reference:
- 10 words ≈ 3.3 seconds
- 15 words ≈ 5 seconds  
- 20 words ≈ 6.7 seconds
- Short punch lines (1-5 words) ≈ 1.5-2 seconds
`;

async function parseScriptIntoScenes(scriptPath) {
  const script = await fs.readFile(scriptPath, 'utf-8');
  
  console.log(`\nParsing script into scenes...`);
  console.log(`Script length: ${script.split(' ').length} words\n`);

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: PARSE_PROMPT },
      { 
        role: 'user', 
        content: `Split this script into scenes. Return ONLY the JSON:\n\n${script}` 
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  const rawOutput = response.choices[0].message.content;
  
  // Extract JSON from response (handle case where LLM wraps in markdown)
  const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Raw output:', rawOutput);
    throw new Error('Could not extract JSON from LLM response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  // Validate structure
  if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
    throw new Error('Invalid scene structure: missing scenes array');
  }

  console.log(`Split into ${parsed.scenes.length} scenes\n`);
  parsed.scenes.forEach(s => {
    console.log(`  Scene ${s.sceneNumber}: ${s.estimatedDurationSeconds}s — "${s.narration.substring(0, 80)}..."`);
  });

  return parsed;
}

// Run if called directly
if (require.main === module) {
  const scriptPath = process.argv[2];
  if (!scriptPath) {
    console.log('Usage: node stage2_parseScript.js output/script_12345.txt');
    process.exit(1);
  }
  
  parseScriptIntoScenes(scriptPath)
    .then(async (result) => {
      const outPath = scriptPath.replace('.txt', '_scenes.json');
      await fs.writeJson(outPath, result, { spaces: 2 });
      console.log(`\n✅ Saved scene breakdown to: ${outPath}`);
    })
    .catch(console.error);
}

module.exports = { parseScriptIntoScenes };