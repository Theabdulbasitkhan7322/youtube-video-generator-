// buildRemotionProject.js
// Marries scene SVG data with real audio timestamps
// Generates a complete Remotion composition

const fs = require('fs-extra');
const path = require('path');

// === CONFIGURATION ===
const FULL_SCENES_PATH = './output/script_1785011482951_fullScenes.json';
const TIMESTAMPS_PATH = './output/voice_1785274515680_sentences.json';
const AUDIO_FILE = 'voice_1785274515680.mp3';
const OUTPUT_DIR = './remotion-test/src';
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

// === HELPERS ===

function msToFrames(ms) {
  return Math.round(ms / 1000 * FPS);
}

function escapeSvgForJsx(svgString) {
  return svgString
    .replace(/stroke-width/g, 'strokeWidth')
    .replace(/stroke-linecap/g, 'strokeLinecap')
    .replace(/stroke-linejoin/g, 'strokeLinejoin')
    .replace(/font-size/g, 'fontSize')
    .replace(/font-family/g, 'fontFamily')
    .replace(/font-weight/g, 'fontWeight')
    .replace(/text-anchor/g, 'textAnchor')
    .replace(/xmlns:xlink/g, 'xmlnsXlink');
}

// IMPORTANT: Inside a <Sequence from={X}>, useCurrentFrame() is ALREADY
// relative to that sequence's start (it returns 0 at the sequence's first frame).
// So we must use `frame` directly here - NOT `frame - fromFrame`.
// The previous bug subtracted fromFrame a second time, making every scene
// after the first render with a deeply negative frame value forever,
// which meant opacity/transform never activated -> blank/blue screen.
function getTransformStyle(animationType, durationFrames) {
  const rel = `frame`;

  switch (animationType) {
    case 'fadeIn':
      return `opacity: Math.min(1, ${rel} / 15)`;
    case 'slideIn':
      return `transform: \`translateX(\${Math.max(0, 100 - ${rel} * 4)}px)\`, opacity: Math.min(1, ${rel} / 10)`;
    case 'bounceIn':
      return `transform: \`translateY(\${Math.sin(${rel} * 0.3) * Math.max(0, 50 - ${rel} * 2)}px)\`, opacity: Math.min(1, ${rel} / 5)`;
    case 'pulseEffect':
      return `transform: \`scale(\${1 + Math.sin(${rel} * 0.1) * 0.02})\`, opacity: Math.min(1, ${rel} / 15)`;
    case 'shakeEffect':
      return `transform: \`translate(\${Math.sin(${rel} * 0.5) * 5}px, \${Math.cos(${rel} * 0.7) * 3}px)\`, opacity: Math.min(1, ${rel} / 10)`;
    case 'drawPath':
      return `opacity: Math.min(1, ${rel} / 30)`;
    case 'slowZoom':
      return `transform: \`scale(\${1 + (${rel} / ${durationFrames}) * 0.08})\`, opacity: Math.min(1, ${rel} / 15)`;
    case 'walkCycle':
      return `transform: \`translateX(\${${rel} * 2}px)\`, opacity: Math.min(1, ${rel} / 10)`;
    case 'smokeBurst':
      return `opacity: ${rel} < 10 ? ${rel} / 10 : Math.max(0, 1 - (${rel} - 10) / 30)`;
    case 'tearFall':
      return `transform: \`translateY(\${Math.min(${rel} * 3, 100)}px)\`, opacity: Math.min(1, ${rel} / 10)`;
    default:
      return `opacity: Math.min(1, ${rel} / 15)`;
  }
}

// === MAIN BUILD FUNCTION ===

async function build() {
  console.log('\n🔨 Building Remotion project from scene data + audio timestamps...\n');

  const fullScenes = await fs.readJson(FULL_SCENES_PATH);
  const timestamps = await fs.readJson(TIMESTAMPS_PATH);

  const scenes = fullScenes.scenes;
  console.log(`Loaded ${scenes.length} scenes with SVG visuals`);
  console.log(`Loaded ${timestamps.length} timestamps from Edge TTS\n`);

  if (scenes.length !== timestamps.length) {
    console.error(`❌ Mismatch! ${scenes.length} scenes vs ${timestamps.length} timestamps`);
    process.exit(1);
  }

  const mergedScenes = scenes.map((scene, i) => ({
    ...scene,
    timestamp: timestamps[i],
  }));

  const lastTimestamp = timestamps[timestamps.length - 1];
  const totalDurationMs = lastTimestamp.offset_ms + lastTimestamp.duration_ms;
  const totalFrames = msToFrames(totalDurationMs);

  console.log(`Total audio duration: ${(totalDurationMs / 1000).toFixed(1)}s`);
  console.log(`Total frames: ${totalFrames} @ ${FPS}fps\n`);

  let sceneComponents = '';
  let sequences = '';

  mergedScenes.forEach((scene, i) => {
    const fromFrame = msToFrames(scene.timestamp.offset_ms);
    const durationFrames = msToFrames(scene.timestamp.duration_ms);
    // Note: getTransformStyle no longer needs fromFrame - see comment above
    const transformStyle = getTransformStyle(scene.animationType, durationFrames);
    const escapedSvg = escapeSvgForJsx(scene.svgCode);

    console.log(`  Scene ${i + 1}: frames ${fromFrame}-${fromFrame + durationFrames} | ${scene.animationType} | "${scene.narration.substring(0, 50)}..."`);

    sceneComponents += `
// Scene ${i + 1}: "${scene.narration.substring(0, 60)}..."
const Scene${i + 1}: React.FC = () => {
  const frame = useCurrentFrame();
  
  return (
    <div style={{ width: ${WIDTH}, height: ${HEIGHT}, overflow: 'hidden', ${transformStyle} }}>
      ${escapedSvg}
    </div>
  );
};
`;

    sequences += `        <Sequence from={${fromFrame}} durationInFrames={${durationFrames}} name="Scene ${i + 1}">
          <Scene${i + 1} />
        </Sequence>
`;
  });

  const compositionSource = `import React from 'react';
import { AbsoluteFill, Sequence, Audio, useCurrentFrame, staticFile } from 'remotion';

// Auto-generated composition
// Total scenes: ${scenes.length}
// Total frames: ${totalFrames}
// Duration: ${(totalFrames / FPS).toFixed(1)}s

${sceneComponents}

export const BeyondObviousComposition: React.FC = () => {
  const audioFile = staticFile('${AUDIO_FILE}');
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
      <Audio src={audioFile} />
${sequences}
    </AbsoluteFill>
  );
};
`;

  const rootSource = `import React from 'react';
import { Composition } from 'remotion';
import { BeyondObviousComposition } from './BeyondObviousComposition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BeyondObvious"
        component={BeyondObviousComposition}
        durationInFrames={${totalFrames}}
        fps={${FPS}}
        width={${WIDTH}}
        height={${HEIGHT}}
      />
    </>
  );
};
`;

  await fs.ensureDir(OUTPUT_DIR);
  await fs.writeFile(path.join(OUTPUT_DIR, 'BeyondObviousComposition.tsx'), compositionSource);
  await fs.writeFile(path.join(OUTPUT_DIR, 'Root.tsx'), rootSource);

  const publicDir = './remotion-test/public';
  await fs.ensureDir(publicDir);
  await fs.copy(
    path.join('./output', AUDIO_FILE),
    path.join(publicDir, AUDIO_FILE)
  );

  console.log('\n✅ Generated:');
  console.log('   remotion-test/src/BeyondObviousComposition.tsx');
  console.log('   remotion-test/src/Root.tsx');
  console.log('   remotion-test/public/' + AUDIO_FILE);
  console.log('\n🚀 Preview: cd remotion-test && npm run dev');
  console.log('🚀 Render:  cd remotion-test && npx remotion render BeyondObvious out/video.mp4\n');
}

build().catch(console.error);