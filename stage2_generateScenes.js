// stage2_generateScenes.js
// Takes scene breakdown → generates React SVG components with animations
// Output: Complete scene data with visuals

require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs-extra');

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

const VISUAL_PROMPT = `
You are a professional explainer-video illustrator, working in the same
visual style as YouTube channels like "Past Tense" and "Sam O'Nella Academy".
You draw populated, detailed scenes — never a lone empty shape floating
in a colored box.

=== CHARACTER STYLE ===
- Head: circle, cream/skin fill (#F5E6C8), 4px black stroke
- Eyebrows: TWO short curved lines above the eyes (this is what gives
  emotion — worried, curious, happy, angry). Never skip eyebrows.
- Eyes: two small circles with visible pupils (small dark dot inside)
- Mouth: single short curved or straight line (no eyes/mouth = incomplete face)
- Body: thin black line for spine, thin lines for arms and legs
- Hands/feet: small filled black ovals or circles at the end of each limb
- Characters can wear simple colored clothing (a rectangle/shape overlay
  in a solid color) when narration implies a role (worker, hunter, historian)

=== MANDATORY SCENE COMPOSITION ===
Every single scene MUST include ALL of these:
1. A visible horizon line splitting sky (top ~75%) from ground (bottom ~25%)
2. At least THREE background/environment elements appropriate to setting
   (trees, clouds, bushes, rocks, huts, buildings, furniture, stars — pick
   based on the scene's setting, never leave background empty)
3. At least ONE prop directly tied to the narration text (if narration
   mentions fire, draw fire; if it mentions a tablet/book, draw one; if
   it mentions a clock, draw a clock)
4. The main character(s) positioned off-center or interacting with props —
   avoid dead-center placement every time, vary composition

=== MULTI-FIGURE SCENES ===
When narration describes groups, families, crowds, or "they" — draw 2-4
stick figures, not just one. Vary their poses (sitting, walking, gesturing)
so the scene feels alive, not copy-pasted.

=== COLOR PALETTE (use these hex codes, pick what fits the scene) ===
- Sky day: #87CEEB | Sky sunset/dawn: #F5A623 | Sky night: #1a1a2e or #2D5016
- Ground grass: #8FBC5A | Ground dirt: #C68642 | Ground sand: #D4A574
- Skin/faces: #F5E6C8
- Trees: trunk #8B6914, leaves #2D5016 or #4A7C29
- Fire: base #FF6B35, flame tip #FFD23F
- Water: #4A90D9
- Accent clothing colors: reds (#D64545), blues (#4A90D9), yellows (#F5C842) —
  pick ONE accent color per scene for clothing/highlight, don't overuse

=== TEXT LABELS ===
If the scene benefits from a location/date label (e.g. a place name, a year),
you may add a small text element in the corner — simple black text, no
fancy fonts, inside a simple circle or plain background box.

=== TECHNICAL RULES ===
- viewBox="0 0 1920 1080" ALWAYS
- Use <rect>, <circle>, <ellipse>, <line>, <polygon>, <path>, <text> as needed
- Every stroke on characters/props: stroke="#000000" stroke-width="4" (or 3 for small details)
- No gradients, no filters — flat fills only
- SVG must be COMPLETE and syntactically valid — no placeholders, no "..."

=== ANIMATION TYPES — specify exactly ONE per scene ===
"fadeIn" | "slideIn" | "bounceIn" | "pulseEffect" | "drawPath" |
"shakeEffect" | "walkCycle" | "smokeBurst" | "tearFall" | "slowZoom"

=== EXAMPLE OF GOOD OUTPUT (study this level of detail/composition) ===
{
  "sceneNumber": 3,
  "svgCode": "<svg viewBox='0 0 1920 1080'><rect x='0' y='0' width='1920' height='780' fill='#F5A623'/><rect x='0' y='780' width='1920' height='300' fill='#8B6914'/><ellipse cx='250' cy='150' rx='80' ry='30' fill='#FFFFFF' stroke='#000' stroke-width='3'/><ellipse cx='1600' cy='120' rx='70' ry='28' fill='#FFFFFF' stroke='#000' stroke-width='3'/><polygon points='150,780 150,550 220,780' fill='#2D5016'/><rect x='175' y='700' width='20' height='80' fill='#8B6914'/><polygon points='1700,780 1700,500 1780,780' fill='#2D5016'/><rect x='1730' y='680' width='20' height='100' fill='#8B6914'/><circle cx='920' cy='550' r='55' fill='#F5E6C8' stroke='#000' stroke-width='4'/><path d='M880,530 Q895,520 910,528' stroke='#000' stroke-width='3' fill='none'/><path d='M930,528 Q945,520 960,530' stroke='#000' stroke-width='3' fill='none'/><circle cx='900' cy='545' r='6' fill='#000'/><circle cx='940' cy='545' r='6' fill='#000'/><path d='M905,570 Q920,578 935,570' stroke='#000' stroke-width='3' fill='none'/><line x1='920' y1='605' x2='920' y2='740' stroke='#000' stroke-width='4'/><line x1='920' y1='650' x2='860' y2='700' stroke='#000' stroke-width='4'/><circle cx='860' cy='700' r='10' fill='#000'/><line x1='920' y1='650' x2='980' y2='700' stroke='#000' stroke-width='4'/><circle cx='980' cy='700' r='10' fill='#000'/><line x1='920' y1='740' x2='880' y2='850' stroke='#000' stroke-width='4'/><circle cx='880' cy='850' r='10' fill='#000'/><line x1='920' y1='740' x2='960' y2='850' stroke='#000' stroke-width='4'/><circle cx='960' cy='850' r='10' fill='#000'/><ellipse cx='1150' cy='820' rx='70' ry='25' fill='#4A7C29'/><path d='M1120,600 L1140,780 L1160,600 Z' fill='#FF6B35'/><path d='M1130,630 L1140,780 L1150,630 Z' fill='#FFD23F'/></svg>",
  "animationType": "fadeIn",
  "animationDurationMs": 2000,
  "keyElements": ["stick figure standing", "trees both sides", "clouds", "fire pit"],
  "colorPalette": {"sky": "#F5A623", "ground": "#8B6914", "accent": "#FF6B35"}
}

Notice how the example has: horizon line, 2 trees, 2 clouds, a fire prop,
a clearly drawn face with eyebrows/eyes/pupils/mouth, proper hands/feet as
circles, and the figure is NOT dead-center. Match this density and quality
level for every scene you generate.

Return ONLY valid JSON in this exact format:
{
  "sceneNumber": 1,
  "svgCode": "<svg viewBox='0 0 1920 1080'>...</svg>",
  "animationType": "fadeIn",
  "animationDurationMs": 2000,
  "keyElements": ["...", "...", "..."],
  "colorPalette": {"sky": "#...", "ground": "#...", "accent": "#..."}
}
`;

async function generateSceneVisual(scene, topic) {
  console.log(`  Generating visual for Scene ${scene.sceneNumber}...`);

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: VISUAL_PROMPT },
      { 
        role: 'user', 
        content: `TOPIC: ${topic}\nSCENE NARRATION: "${scene.narration}"\nEMOTIONAL TONE: ${scene.emotionalTone}\n\nGenerate a fully populated scene (horizon line, 3+ background elements, narration-relevant prop, expressive face with eyebrows/eyes/mouth). Return ONLY the JSON.` 
      }
    ],
    temperature: 0.6,
    max_tokens: 2000
  });

  const rawOutput = response.choices[0].message.content;
  
  const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(`  ⚠️  Scene ${scene.sceneNumber}: Could not parse JSON, using fallback`);
    return generateFallbackScene(scene);
  }

  try {
    const visualData = JSON.parse(jsonMatch[0]);
    
    if (!visualData.svgCode || !visualData.svgCode.includes('<svg')) {
      throw new Error('Missing or invalid SVG');
    }
    
    return visualData;
  } catch (err) {
    console.warn(`  ⚠️  Scene ${scene.sceneNumber}: ${err.message}, using fallback`);
    return generateFallbackScene(scene);
  }
}

function generateFallbackScene(scene) {
  // Improved fallback — still populated, not a bare circle in a box
  return {
    sceneNumber: scene.sceneNumber,
    svgCode: `<svg viewBox="0 0 1920 1080">
  <rect x="0" y="0" width="1920" height="780" fill="#1a1a2e"/>
  <rect x="0" y="780" width="1920" height="300" fill="#16213e"/>
  <circle cx="300" cy="150" r="8" fill="#FFFFFF"/>
  <circle cx="500" cy="220" r="5" fill="#FFFFFF"/>
  <circle cx="1400" cy="180" r="6" fill="#FFFFFF"/>
  <circle cx="1600" cy="260" r="8" fill="#FFFFFF"/>
  <circle cx="960" cy="520" r="55" fill="#F5E6C8" stroke="#000" stroke-width="4"/>
  <path d="M920,500 Q935,492 950,498" stroke="#000" stroke-width="3" fill="none"/>
  <path d="M970,498 Q985,492 1000,500" stroke="#000" stroke-width="3" fill="none"/>
  <circle cx="940" cy="515" r="6" fill="#000"/>
  <circle cx="980" cy="515" r="6" fill="#000"/>
  <path d="M945,540 Q960,548 975,540" stroke="#000" stroke-width="3" fill="none"/>
  <line x1="960" y1="575" x2="960" y2="720" stroke="#000" stroke-width="4"/>
  <line x1="960" y1="620" x2="900" y2="670" stroke="#000" stroke-width="4"/>
  <circle cx="900" cy="670" r="10" fill="#000"/>
  <line x1="960" y1="620" x2="1020" y2="670" stroke="#000" stroke-width="4"/>
  <circle cx="1020" cy="670" r="10" fill="#000"/>
  <line x1="960" y1="720" x2="920" y2="850" stroke="#000" stroke-width="4"/>
  <circle cx="920" cy="850" r="10" fill="#000"/>
  <line x1="960" y1="720" x2="1000" y2="850" stroke="#000" stroke-width="4"/>
  <circle cx="1000" cy="850" r="10" fill="#000"/>
</svg>`,
    animationType: "fadeIn",
    animationDurationMs: 2000,
    keyElements: ["stick figure", "night sky", "stars", "fallback"],
    colorPalette: { sky: "#1a1a2e", ground: "#16213e", accent: "#FFFFFF" }
  };
}

async function generateAllSceneVisuals(sceneData, topic) {
  console.log(`\nGenerating visuals for ${sceneData.scenes.length} scenes...\n`);
  
  const fullScenes = [];
  
  for (const scene of sceneData.scenes) {
    const visualData = await generateSceneVisual(scene, topic);
    
    fullScenes.push({
      ...scene,
      ...visualData,
      sceneNumber: scene.sceneNumber
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return fullScenes;
}

if (require.main === module) {
  const scenesPath = process.argv[2];
  const topic = process.argv[3] || 'Unknown Topic';
  
  if (!scenesPath) {
    console.log('Usage: node stage2_generateScenes.js output/script_12345_scenes.json "Topic Name"');
    process.exit(1);
  }
  
  fs.readJson(scenesPath)
    .then(sceneData => generateAllSceneVisuals(sceneData, topic))
    .then(async (fullScenes) => {
      const outPath = scenesPath.replace('_scenes.json', '_fullScenes.json');
      await fs.writeJson(outPath, { topic, scenes: fullScenes }, { spaces: 2 });
      console.log(`\n✅ Full scene data saved to: ${outPath}`);
    })
    .catch(console.error);
}

module.exports = { generateAllSceneVisuals, generateSceneVisual };