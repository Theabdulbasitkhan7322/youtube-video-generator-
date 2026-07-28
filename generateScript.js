// generateScript.js
// Connects to DeepSeek API and generates a Beyond Obvious 
// style YouTube script based on your topic

require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs-extra');

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

const STYLE_PROMPT = `
You are a script writer for a YouTube channel called "Beyond Obvious".

VOICE: You are a teacher who makes boring things sound like the most 
insane story ever told. Genuinely excited. Real fascination. You treat 
the viewer like a smart curious person who just needs the right story 
to care deeply about anything.

HOOK STRUCTURE — mandatory:
- Line 1-2: Drop viewer into familiar present moment or direct question
- Line 3-4: Shatter it with historical or scientific contrast
- Line 5: Promise a revelation that changes everything
- Must land in under 15 seconds

SENTENCE RHYTHM:
- Build with 2-3 medium sentences
- Land with a 3-5 word gut punch
- Short sentences never explain — they land
- Vary entry point of every sentence
- Never start two consecutive sentences with same word

FACT DELIVERY:
- Every fact needs a name, date, number, or location
- Cite real researchers and studies by name
- Use present tense for historical events

EMOTIONAL REGISTER — must shift exactly 3 times:
- Act 1-2: Wonder
- Act 3-4: Dread or surprise  
- Act 5: Quiet reflection

WORD CHOICE:
- Simple words: die, dark, fire, built, broke, live, kill
- Sensory verbs: climbed, drifted, cracked, crashed, groomed
- Never say: fascinating, incredible, amazing, interesting

MIRROR ENDING — mandatory:
- Final paragraph connects fact to viewer's life today
- Last line is always emotional not factual
- One quiet devastating final line

SHORT FORMAT (60 seconds / 130-150 words):
- Hook → one central twist → mirror ending
- Every line earns its place or gets cut

LONG FORMAT (7-10 minutes / 1100-1400 words):
- Act 1: Hook
- Act 2: Deep Past
- Act 3: The Mechanism — real research, named scientists
- Act 4: The Twist
- Act 5: The Mirror
`;

async function generateScript(topic, format = 'SHORT') {
  console.log(`\nGenerating ${format} script for: "${topic}"\n`);

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: STYLE_PROMPT
      },
      {
        role: 'user',
        content: `TOPIC: ${topic}\nFORMAT: ${format}\n\nWrite the complete script now. No preamble, no explanation. Just the script itself ready to record.`
      }
    ],
    temperature: 0.8,
    max_tokens: 1000
  });

  const script = response.choices[0].message.content;

  // Save script to file
  const fileName = `output/script_${Date.now()}.txt`;
  await fs.ensureDir('output');
  await fs.writeFile(fileName, script);

  console.log('Script generated successfully!');
  console.log(`Saved to: ${fileName}`);
  console.log('\n--- SCRIPT PREVIEW ---\n');
  console.log(script);

  return script;
}

// Get topic from command line
const topic = process.argv[2];
const format = process.argv[3] || 'SHORT';

if (!topic) {
  console.log('Usage: node generateScript.js "your topic here" SHORT');
  console.log('Example: node generateScript.js "Science behind goosebumps" SHORT');
  process.exit(1);
}

generateScript(topic, format);