// runPipeline.js
// THE ORCHESTRATOR
// Takes a topic + format, runs every stage automatically,
// ends with a rendered MP4. No manual filename copying.
//
// FIX: Each run's findLatestFile() call now takes the pipeline's start
// timestamp and REJECTS any file older than that. This prevents ever
// picking up a leftover/stale file from a previous crashed run —
// which is exactly what caused the "4 scenes vs 26 timestamps" mismatch.
// If a stage genuinely produced nothing new, we now fail loudly and
// immediately instead of silently continuing with wrong data.

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

function run(command, label) {
  console.log(`\n▶ ${label}`);
  console.log(`  $ ${command}\n`);
  execSync(command, { stdio: 'inherit' });
}

async function findLatestFile(pattern, runStartTime) {
  const files = await fs.readdir('output');
  const matches = files.filter(f => pattern.test(f));

  if (matches.length === 0) {
    throw new Error(`No file found matching ${pattern}`);
  }

  const withTimes = await Promise.all(
    matches.map(async (f) => {
      const stat = await fs.stat(path.join('output', f));
      return { file: f, mtime: stat.mtimeMs };
    })
  );

  // Only accept files created during THIS run — this is the actual fix
  const freshFiles = withTimes.filter(f => f.mtime >= runStartTime);

  if (freshFiles.length === 0) {
    const newest = withTimes.sort((a, b) => b.mtime - a.mtime)[0];
    throw new Error(
      `No fresh file matching ${pattern} was created during this run.\n` +
      `  The most recent matching file is "${newest.file}" but it's from a PREVIOUS run.\n` +
      `  This means the previous stage failed or produced nothing new — check its output above for errors (e.g. rate limits).`
    );
  }

  freshFiles.sort((a, b) => b.mtime - a.mtime);
  return freshFiles[0].file;
}

async function runPipeline(topic, format = 'SHORT') {
  console.log('\n═══════════════════════════════════════');
  console.log(`  BEYOND OBVIOUS PIPELINE`);
  console.log(`  Topic: "${topic}"`);
  console.log(`  Format: ${format}`);
  console.log('═══════════════════════════════════════');

  const runStartTime = Date.now();

  // ── STAGE 1: Generate Script ──────────────────────────
  run(
    `node generateScript.js "${topic}" ${format}`,
    'STAGE 1: Generating script'
  );

  const scriptFile = await findLatestFile(/^script_\d+\.txt$/, runStartTime);
  const scriptPath = `output/${scriptFile}`;
  console.log(`  ✓ Script: ${scriptPath}`);

  // ── STAGE 2A: Parse script into timed scenes ──────────
  run(
    `node stage2_parseScript.js "${scriptPath}"`,
    'STAGE 2A: Parsing script into scenes'
  );

  const scenesFile = await findLatestFile(/_scenes\.json$/, runStartTime);
  const scenesPath = `output/${scenesFile}`;
  console.log(`  ✓ Scenes: ${scenesPath}`);

  // ── STAGE 2B: Generate SVG visuals for each scene ─────
  run(
    `node stage2_generateScenes.js "${scenesPath}" "${topic}"`,
    'STAGE 2B: Generating scene visuals'
  );

  const fullScenesFile = await findLatestFile(/_fullScenes\.json$/, runStartTime);
  const fullScenesPath = `output/${fullScenesFile}`;
  console.log(`  ✓ Full scenes: ${fullScenesPath}`);

  // ── STAGE 3: Generate voice + timestamps ──────────────
  run(
    `node generateVoiceWithTimestamps.js "${scriptPath}"`,
    'STAGE 3: Generating voiceover + timestamps'
  );

  const audioFile = await findLatestFile(/^voice_\d+\.mp3$/, runStartTime);
  const timestampFile = await findLatestFile(/_sentences\.json$/, runStartTime);
  console.log(`  ✓ Audio: output/${audioFile}`);
  console.log(`  ✓ Timestamps: output/${timestampFile}`);

  // ── STAGE 4: Build Remotion project ───────────────────
  let builderCode = await fs.readFile('buildRemotionProject.js', 'utf-8');
  builderCode = builderCode.replace(
    /const FULL_SCENES_PATH = .*/,
    `const FULL_SCENES_PATH = './output/${fullScenesFile}';`
  );
  builderCode = builderCode.replace(
    /const TIMESTAMPS_PATH = .*/,
    `const TIMESTAMPS_PATH = './output/${timestampFile}';`
  );
  builderCode = builderCode.replace(
    /const AUDIO_FILE = .*/,
    `const AUDIO_FILE = '${audioFile}';`
  );
  await fs.writeFile('buildRemotionProject.js', builderCode);

  run(
    `node buildRemotionProject.js`,
    'STAGE 4: Building Remotion composition'
  );

  // ── STAGE 5: Render final MP4 ──────────────────────────
  const safeTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const outputVideoName = `${safeTopic}_${Date.now()}.mp4`;

  run(
    `cd remotion-test && npx remotion render BeyondObvious out/${outputVideoName}`,
    'STAGE 5: Rendering final MP4'
  );

  const finalPath = `remotion-test/out/${outputVideoName}`;

  console.log('\n═══════════════════════════════════════');
  console.log('  ✅ PIPELINE COMPLETE');
  console.log(`  Video: ${finalPath}`);
  console.log('═══════════════════════════════════════\n');
}

const topic = process.argv[2];
const format = process.argv[3] || 'SHORT';

if (!topic) {
  console.log('Usage: node runPipeline.js "your topic here" [SHORT|LONG]');
  console.log('Example: node runPipeline.js "Why goosebumps happen" SHORT');
  process.exit(1);
}

runPipeline(topic, format).catch((err) => {
  console.error('\n❌ Pipeline failed:', err.message);
  process.exit(1);
});