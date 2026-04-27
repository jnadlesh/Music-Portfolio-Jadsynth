#!/usr/bin/env node
import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const AUDIO_DIR = resolve(ROOT, "public/audio");
const TRACKS_JSON = resolve(ROOT, "tracks.json");
const BITRATE = "192k";

function run(cmd, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${cmd} exited ${code}: ${err}`));
    });
  });
}

async function ensureFfmpeg() {
  try {
    await run("ffmpeg", ["-version"]);
  } catch {
    console.error(
      "\nffmpeg not found. Install it first:\n" +
        "  - Windows:  winget install Gyan.FFmpeg\n" +
        "  - macOS:    brew install ffmpeg\n" +
        "  - Linux:    apt/pacman/dnf install ffmpeg\n",
    );
    process.exit(1);
  }
}

async function main() {
  await ensureFfmpeg();

  const entries = await readdir(AUDIO_DIR);
  const wavs = entries.filter((f) => f.toLowerCase().endsWith(".wav"));
  if (wavs.length === 0) {
    console.log("No .wav files in public/audio.");
    return;
  }

  for (const wav of wavs) {
    const wavPath = resolve(AUDIO_DIR, wav);
    const mp3Name = basename(wav, extname(wav)) + ".mp3";
    const mp3Path = resolve(AUDIO_DIR, mp3Name);

    try {
      await stat(mp3Path);
      console.log(`skip ${wav} → ${mp3Name} (already exists)`);
      continue;
    } catch {
      /* not yet converted */
    }

    process.stdout.write(`encoding ${wav} → ${mp3Name} … `);
    await run("ffmpeg", [
      "-loglevel",
      "error",
      "-i",
      wavPath,
      "-codec:a",
      "libmp3lame",
      "-b:a",
      BITRATE,
      mp3Path,
    ]);
    console.log("✓");
  }

  const json = JSON.parse(await readFile(TRACKS_JSON, "utf8"));
  let rewrites = 0;
  for (const t of json.tracks) {
    if (typeof t.audioFile === "string" && t.audioFile.endsWith(".wav")) {
      t.audioFile = t.audioFile.replace(/\.wav$/i, ".mp3");
      rewrites++;
    }
  }
  if (rewrites > 0) {
    await writeFile(TRACKS_JSON, JSON.stringify(json, null, 2) + "\n", "utf8");
    console.log(`\nrewrote ${rewrites} audioFile path(s) in tracks.json`);
    console.log("now run: npm run sync-tracks");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
