import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

const media = path.resolve("public/media");
const clips = readdirSync(media)
  .filter((name) => /^assemble-.+\.mp4$/.test(name))
  .sort();

if (!clips.length) {
  console.error("No assemble-*.mp4 files in public/media");
  process.exit(1);
}

function requireTool(name) {
  try {
    execFileSync(name, ["-version"], { stdio: "ignore" });
  } catch {
    console.error(`${name} is required. Install it, then run npm run posters again.`);
    process.exit(1);
  }
}

function lastFrameIndex(file) {
  const raw = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-count_frames",
      "-show_entries",
      "stream=nb_read_frames,nb_frames",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8" },
  );
  const stream = JSON.parse(raw).streams?.[0] ?? {};
  const count = Number(stream.nb_read_frames || stream.nb_frames);
  if (!Number.isFinite(count) || count < 1) {
    throw new Error(`Could not count frames in ${path.basename(file)}`);
  }
  return count - 1;
}

requireTool("ffmpeg");
requireTool("ffprobe");

for (const name of clips) {
  const input = path.join(media, name);
  const output = path.join(media, name.replace(/\.mp4$/, ".webp"));
  const index = lastFrameIndex(input);
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      input,
      "-vf",
      `select=eq(n\\,${index})`,
      "-frames:v",
      "1",
      "-c:v",
      "libwebp",
      "-quality",
      "80",
      output,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  console.log(`Wrote ${path.relative(process.cwd(), output)} from frame ${index}`);
}
