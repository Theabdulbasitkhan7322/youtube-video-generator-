# YouTube Video Generator Pipeline

An automated pipeline that turns a single topic into a fully rendered,
narrated explainer video — no manual editing required. Built for YouTube channels (science, history, and psychology
content in a curious, wonder-driven storytelling style).

Input: a topic string.
Output: a rendered MP4 with voiceover, timed visuals, and synced audio.

---

## What's working

- **Script generation** — takes a topic, generates a narration script
  in the channel's house style (Groq / Llama 3.3 70B)
- **Scene timing breakdown** — splits the script into timed narration
  segments with emotional tone tags
- **Voiceover** — generates narration audio with real sentence-level
  timestamps (Edge TTS, free, local)
- **Video assembly + render** — merges scene visuals and audio into a
  timed Remotion composition and renders a final MP4
- **Full orchestration** — one command (`node runPipeline.js "topic"
  SHORT`) runs every stage automatically end to end, no manual file
  copying between steps

The pipeline has successfully gone from a topic string to a finished,
playable MP4 with zero manual intervention.

The visual generation stage (the illustrations for each scene) is
currently the weakest link and is being reworked to hit a higher
quality bar.

---

## Tech stack

| Purpose | Tool |
|---|---|
| Script + scene generation | Groq API (Llama 3.3 70B) |
| Voiceover | Edge TTS |
| Video rendering | Remotion |
| Orchestration | Node.js |

No paid APIs required.

---

## Setup

```bash
git clone https://github.com/Theabdulbasitkhan7322/youtube-video-generator-.git
cd youtube-video-generator-
npm install
pip install edge-tts
```

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_groq_api_key_here
```

Set up the Remotion project (one-time):

```bash
cd remotion-test
npm install
cd ..
```

---

## Usage

```bash
node runPipeline.js "Your topic here" SHORT
```

or

```bash
node runPipeline.js "Your topic here" LONG
```

Finished video is saved to `remotion-test/out/`.

---
---
 
## 🚧 Known Limitations & Roadmap
 
The pipeline is functional end-to-end, but the visual quality isn't 
where it needs to be yet.
 
**Current focus:**
- **Visual Generation (Critical Path):** Scene illustrations are 
  currently raw SVG generated freehand by an LLM, which produces 
  inconsistent quality — sparse scenes, missing details, unreliable 
  composition. Rebuilding this into a **deterministic animation 
  engine**: a hand-built library of reusable SVG assets (character 
  rig with poses/expressions, backgrounds, props), where the LLM's 
  job shifts from *drawing* to *directing* — it selects from a 
  defined asset menu and outputs a structured scene JSON, and code 
  deterministically renders the actual visuals from that. This 
  removes the LLM from ever generating vector graphics by hand.
- Starting this rebuild with the asset library itself — the reusable 
  character and scene components everything else will be built on.
  
**Future work:**

- Wire the new asset-driven scene JSON into the Remotion renderer
- Multi-provider LLM fallback to avoid single-provider daily rate-limit
  crashes on long scripts
---

## License

Personal project — not currently licensed for reuse.
