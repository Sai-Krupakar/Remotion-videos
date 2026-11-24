"""Fully automatic stickman video: topic -> AI script -> narration -> render -> YouTube upload.

  python scripts/pipeline.py                      # pick a topic, make the video, upload it
  python scripts/pipeline.py --topic "Why bees matter"
  python scripts/pipeline.py --no-upload          # make the video only
  python scripts/pipeline.py --auth-only          # one-time YouTube login
  python scripts/pipeline.py --script-file my-script.json --no-upload   # skip the AI step

Topics come from --topic, else the first line of topics.txt (removed once uploaded),
else the AI invents a new one that avoids previous titles. Settings live in .env
(see .env.example). Everything is written to outputs/auto/<date>-<slug>/.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

AUTO_DIR = ROOT / "outputs" / "auto"
HISTORY = AUTO_DIR / "history.json"
TOPICS = ROOT / "topics.txt"
SECRETS = ROOT / ".secrets"
EXAMPLE_SCRIPT = ROOT / "src" / "stories" / "little-seed-script.json"
MAX_ATTEMPTS = 4

ACTIONS = ["idle", "walking", "running", "jumping", "falling", "sitting", "standing-up", "waving", "talking",
           "thinking", "pointing", "celebrating", "looking-around", "shaking-head", "surprised", "sleeping", "stretching"]
EXPRESSIONS = ["neutral", "happy", "sad", "angry", "surprised", "confused", "crying", "laughing", "scared", "thinking"]

SYSTEM_PROMPT = f"""You write short animated explainer stories for a YouTube Shorts channel. The video is drawn
automatically from a JSON script: a cartoon stickman hero, simple backgrounds, props, camera moves, captions and
narration. Reply with ONE JSON object only:
{{"youtube": {{"title": str (max 90 chars, catchy, no emojis), "description": str (2-4 sentences, then 3-5 hashtags),
  "tags": [5-12 short strings]}},
 "script": <story script>}}

STORY SCRIPT FORMAT (follow the example exactly; any other field is an error):
- "title", "hero": {{"characterType": "toon", "scale": 1.75}}, "places", "scenes". Do not set "voice".
- "places": every real spot is defined once: {{"<name>": {{"location": L, "props": [fixtures]}}}}.
  L is one of: sidewalk, garden, living-room, park, street, room, bedroom, night.
- "scenes": 10-14 scenes, each {{"id": "kebab-case", "place": "<place name>", "lines": [2-3 lines]}}.
  22-30 lines in total. Each line is ONE narrated sentence of 6-14 words, past tense, third person.
- Line fields: "text" (required), "move" (stay | walk | run | enter-left | enter-right | exit-left | exit-right),
  "to" (hero x target 0.15-0.85), "action" ({", ".join(ACTIONS)}),
  "expression" ({", ".join(EXPRESSIONS)}), "camera" (wide | push-in | pull-out | close-up | punch-in | follow | prop),
  "props", "cast", "tag" (1-4 word label, on about a third of lines), "highlight" (1-2 words copied from the text),
  "letterbox" (true for dramatic or sad moments), "take" (ids of kept props the hero picks up).
- Screen coordinates: x 0 = left, 1 = right. Characters stand on the ground automatically.
  Prop "y" (ground level ~0.75-0.8): seed 0.79 scale 0.35, sprout 0.75 scale 0.8, flower 0.76 scale 0.7-1.2,
  garden-bed 0.8 scale 1.1, bench 0.775 scale 0.7, tree 0.7 scale 1, lamp-post 0.62 scale 0.9, car 0.86 scale 0.9,
  house 0.62 scale 1, plant-pot 0.7 scale 0.75, sofa 0.71 scale 1.05, table 0.73 scale 0.6, laptop 0.665 scale 0.4
  (on a table), chair 0.74 scale 0.8, bed 0.77 scale 1.3, door 0.6 scale 0.8, clock 0.35 scale 0.8,
  phone 0.6 scale 0.4, box 0.6 scale 0.32 (with "carry": true the hero holds it), watering-can 0.65 scale 0.55,
  bee 0.5-0.6 scale 0.45, alarm 0.6 scale 0.8, obstacle 0.86 scale 1.
  Prop fields: id, keep, type, x, y, scale, rotation, appear (pop-in second, 0.2-1.8), from [x, y] + at (fly in,
  at 0.8-2.0), carry.
- CONTINUITY: anything that should stay in a place (planted things, built things, furniture added later) uses
  "keep": true with an "id"; it then appears automatically in every later shot of that place, so do not repeat it.
  Reuse the same id to change it (sprout -> flower). A kept prop can never be used in another place unless a line
  first lists its id in "take". Keep the same place for the same real-world spot for the whole story.
- "cast": other characters in this shot only: {{"id", "x", "enter": "left"|"right" (optional), "action",
  "expression", "accessory": "cap"|"bow"}}. List them again in every line where they are present, with the same
  id and accessory. Keep characters at least 0.3 apart in x and away from props they would hide.
- Camera "prop" focuses the last prop listed in the line; use it only for lines that list props. Vary cameras; a
  hard "punch-in" works for surprises, "close-up" for feelings, "pull-out" to reveal places.
- Content: original, upbeat, family-friendly for a general audience, accurate when explaining facts, no real people,
  brands or copyrighted characters. Strong hook in the first line and a satisfying ending or takeaway.

EXAMPLE SCRIPT:
{EXAMPLE_SCRIPT.read_text(encoding="utf-8-sig")}
"""


def load_env() -> None:
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for raw in env_file.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def http_session():
    try:
        import truststore  # uses the Windows certificate store (needed behind corporate proxies)

        truststore.inject_into_ssl()
    except ImportError:
        pass
    import requests

    return requests.Session()


# ---------------------------------------------------------------- AI script writing

def ask_llm(messages: list[dict]) -> str:
    """messages: [{"role": "user"|"assistant", "text": str}]. Returns the model's text reply."""
    session = http_session()
    provider = os.environ.get("LLM_PROVIDER", "gemini").lower()
    for attempt in range(5):
        if provider == "gemini":
            key = os.environ.get("GEMINI_API_KEY") or sys.exit("Set GEMINI_API_KEY in .env (see .env.example).")
            model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
            response = session.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                headers={"x-goog-api-key": key},
                json={
                    "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                    "contents": [
                        {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["text"]}]}
                        for m in messages
                    ],
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.9},
                },
                timeout=300,
            )
        else:
            key = os.environ.get("OPENAI_API_KEY") or sys.exit("Set OPENAI_API_KEY in .env.")
            base = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
            response = session.post(
                f"{base}/chat/completions",
                headers={"Authorization": f"Bearer {key}"},
                json={
                    "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
                    "response_format": {"type": "json_object"},
                    "messages": [{"role": "system", "content": SYSTEM_PROMPT}]
                    + [{"role": m["role"], "content": m["text"]} for m in messages],
                },
                timeout=300,
            )
        if response.status_code in (429, 500, 502, 503, 504) and attempt < 4:
            wait = 20 * (attempt + 1)
            print(f"  AI service busy ({response.status_code}); retrying in {wait}s")
            time.sleep(wait)
            continue
        if not response.ok:
            sys.exit(f"AI request failed ({response.status_code}): {response.text[:500]}")
        data = response.json()
        if provider == "gemini":
            parts = data["candidates"][0]["content"]["parts"]
            return "".join(p.get("text", "") for p in parts if not p.get("thought"))
        return data["choices"][0]["message"]["content"]
    sys.exit("AI service kept failing.")


def parse_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    start, end = text.find("{"), text.rfind("}")
    return json.loads(text[start:end + 1])


def validate(script: dict, work: Path) -> list[str]:
    path = work / "candidate-script.json"
    path.write_text(json.dumps(script, indent=2), encoding="utf-8")
    result = subprocess.run(
        ["node", "scripts/story-tool.mjs", "validate", str(path)], cwd=ROOT, capture_output=True, text=True,
        encoding="utf-8", errors="replace",
    )
    path.unlink()
    try:
        return json.loads(result.stdout.strip().splitlines()[-1])["errors"]
    except (IndexError, ValueError, KeyError):
        return [f"Validator crashed: {result.stderr.strip()[-1000:]}"]


def write_script(topic: str | None, recent_titles: list[str], work: Path) -> dict:
    theme = os.environ.get("CHANNEL_THEME", "short feel-good animated stories with a fun fact or a life lesson")
    if topic:
        request = f"Write a new story for this topic: {topic}"
    else:
        avoid = "\n".join(f"- {t}" for t in recent_titles[-40:]) or "- (none yet)"
        request = f"Invent a fresh, original topic for a channel about {theme}, then write the story. " \
                  f"Do not repeat or closely resemble these previous videos:\n{avoid}"
    messages = [{"role": "user", "text": request}]
    for attempt in range(1, MAX_ATTEMPTS + 1):
        print(f"  Writing script (attempt {attempt})...")
        reply = ask_llm(messages)
        try:
            result = parse_json(reply)
            errors = validate(result["script"], work) if "script" in result and "youtube" in result \
                else ['Reply must have "youtube" and "script".']
        except (ValueError, KeyError, TypeError) as error:
            result, errors = None, [f"Reply was not valid JSON: {error}"]
        if not errors and result is not None:
            return result
        print("  Script problems:\n    " + "\n    ".join(errors[:10]))
        messages += [
            {"role": "assistant", "text": reply},
            {"role": "user", "text": "Fix these problems and reply with the full corrected JSON:\n" + "\n".join(errors)},
        ]
    sys.exit("The AI could not produce a valid script. Try again or use a different topic.")


# ---------------------------------------------------------------- YouTube

UPLOAD_SCOPE = ["https://www.googleapis.com/auth/youtube.upload"]


def youtube_credentials():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow

    http_session()  # enables the Windows certificate store
    token_path = SECRETS / "youtube-token.json"
    client_path = SECRETS / "client_secret.json"
    creds = Credentials.from_authorized_user_file(str(token_path), UPLOAD_SCOPE) if token_path.exists() else None
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    if not creds or not creds.valid:
        if not client_path.exists():
            sys.exit(f"Missing {client_path}. Follow 'YouTube upload setup' in README.md.")
        creds = InstalledAppFlow.from_client_secrets_file(str(client_path), UPLOAD_SCOPE).run_local_server(port=0)
    SECRETS.mkdir(exist_ok=True)
    token_path.write_text(creds.to_json(), encoding="utf-8")
    return creds


def upload_to_youtube(video: Path, thumbnail: Path | None, meta: dict, seconds: float) -> dict:
    from google.auth.transport.requests import AuthorizedSession

    session = AuthorizedSession(youtube_credentials())
    description = meta.get("description", "").strip()
    if seconds <= 180 and "#shorts" not in description.lower():
        description += "\n\n#Shorts"
    tags, used = [], 0
    for tag in meta.get("tags", []):
        tag = str(tag).replace("<", "").replace(">", "").strip()
        if tag and used + len(tag) + 2 <= 450:
            tags.append(tag)
            used += len(tag) + 2
    body = {
        "snippet": {
            "title": meta["title"][:100],
            "description": description[:4900],
            "tags": tags,
            "categoryId": os.environ.get("YOUTUBE_CATEGORY_ID", "1"),
            "defaultLanguage": "en",
            "defaultAudioLanguage": "en",
        },
        "status": {
            "privacyStatus": os.environ.get("YOUTUBE_PRIVACY", "public"),
            "selfDeclaredMadeForKids": False,
            "containsSyntheticMedia": False,
            "embeddable": True,
        },
    }
    size = video.stat().st_size
    start = session.post(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        json=body,
        headers={"X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size)},
    )
    if not start.ok:
        sys.exit(f"YouTube rejected the upload ({start.status_code}): {start.text[:800]}")
    with video.open("rb") as handle:
        result = session.put(start.headers["Location"], data=handle, headers={"Content-Type": "video/mp4"}, timeout=3600)
    if not result.ok:
        sys.exit(f"YouTube upload failed ({result.status_code}): {result.text[:800]}")
    uploaded = result.json()
    if thumbnail and thumbnail.exists():
        thumb = session.post(
            f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={uploaded['id']}",
            data=thumbnail.read_bytes(), headers={"Content-Type": "image/jpeg"},
        )
        if not thumb.ok:
            print(f"  Thumbnail not set ({thumb.status_code}); custom thumbnails need a phone-verified channel.")
    return uploaded


# ---------------------------------------------------------------- pipeline

def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        sys.exit(f"Command failed: {' '.join(cmd)}\n{result.stdout[-2000:]}\n{result.stderr[-2000:]}")
    return result.stdout


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:50] or "video"


def next_topic() -> str | None:
    if TOPICS.exists():
        for line in TOPICS.read_text(encoding="utf-8-sig").splitlines():
            if line.strip() and not line.strip().startswith("#"):
                return line.strip()
    return None


def remove_topic(topic: str) -> None:
    if TOPICS.exists():
        lines = TOPICS.read_text(encoding="utf-8-sig").splitlines()
        if topic in [line.strip() for line in lines]:
            index = [line.strip() for line in lines].index(topic)
            del lines[index]
            TOPICS.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--topic")
    parser.add_argument("--script-file", help="use an existing script JSON instead of the AI")
    parser.add_argument("--voice", help="narrator voice, e.g. piper:en_GB-alan-medium (default from .env or Ryan)")
    parser.add_argument("--resolution", choices=["1080", "720"], default="1080")
    parser.add_argument("--no-upload", action="store_true")
    parser.add_argument("--auth-only", action="store_true", help="log in to YouTube and save the token")
    args = parser.parse_args()
    load_env()

    if args.auth_only:
        youtube_credentials()
        print(f"YouTube login saved to {SECRETS / 'youtube-token.json'}")
        return

    history = json.loads(HISTORY.read_text(encoding="utf-8")) if HISTORY.exists() else []
    from_file = args.topic is None and args.script_file is None
    topic = args.topic or (next_topic() if from_file else None)
    AUTO_DIR.mkdir(parents=True, exist_ok=True)
    scratch = AUTO_DIR / "_work"
    scratch.mkdir(exist_ok=True)

    label = args.script_file or topic or "AI picks a new topic"
    print(f"1/5 Script  ({label})")
    if args.script_file:
        script = json.loads(Path(args.script_file).read_text(encoding="utf-8-sig"))
        errors = validate(script, scratch)
        if errors:
            sys.exit("Script problems:\n  " + "\n  ".join(errors))
        result = {"script": script, "youtube": {"title": script["title"], "description": script["title"], "tags": []}}
    else:
        result = write_script(topic, [h["title"] for h in history], scratch)
    script, meta = result["script"], result["youtube"]
    script.pop("shotSeconds", None)
    script["voice"] = args.voice or os.environ.get("NARRATION_VOICE") or script.get("voice") or "piper:en_US-ryan-medium"
    script.setdefault("voiceSpeed", float(os.environ.get("NARRATION_SPEED", "1.05")))

    slug = f"{dt.date.today():%Y-%m-%d}-{slugify(meta['title'])}"
    work = AUTO_DIR / slug
    work.mkdir(parents=True, exist_ok=True)
    (work / "script.json").write_text(json.dumps(script, indent=2), encoding="utf-8")
    (work / "youtube.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"    {meta['title']}  ->  {work.relative_to(ROOT)}")

    print("2/5 Narration")
    from create_narration import generate_narration

    audio_rel = f"audio/auto/{slug}"
    generate_narration(script, ROOT / "public" / audio_rel, work / "timings.json", work / "transcript.txt")

    print("3/5 Render")
    width, height = ("1080", "1920") if args.resolution == "1080" else ("720", "1280")
    info = json.loads(run(["node", "scripts/story-tool.mjs", "build", str(work / "script.json"),
                           str(work / "timings.json"), audio_rel, str(work / "story.json"), width, height]).strip().splitlines()[-1])
    video, thumbnail = work / "video.mp4", work / "thumbnail.jpg"
    run(["node", "scripts/render.mjs", "--props", str(work / "story.json"), "--output", str(video),
         "--concurrency", os.environ.get("RENDER_CONCURRENCY", "1")])
    run(["node", "scripts/render.mjs", "--props", str(work / "story.json"), "--output", str(thumbnail),
         "--frame", str(int(info["seconds"] * 30 * 0.3))])
    print(f"    {video.relative_to(ROOT)}  ({info['seconds']}s, {info['shots']} shots)")

    entry = {"date": dt.datetime.now().isoformat(timespec="seconds"), "title": meta["title"], "topic": topic, "slug": slug}
    if args.no_upload:
        print("4/5 Upload skipped (--no-upload)")
    else:
        print("4/5 Upload to YouTube")
        uploaded = upload_to_youtube(video, thumbnail, meta, info["seconds"])
        video_url = f"https://www.youtube.com/{'shorts/' if info['seconds'] <= 180 else 'watch?v='}{uploaded['id']}"
        entry.update(videoId=uploaded["id"], url=video_url,
                     privacy=uploaded.get("status", {}).get("privacyStatus"))
        print(f"    {entry['url']}  ({entry['privacy']})")
        wanted = os.environ.get("YOUTUBE_PRIVACY", "public")
        if entry["privacy"] != wanted:
            print(f"    Note: YouTube set this video to {entry['privacy']}. Unverified API projects can only upload "
                  "private videos until Google approves the project (see README).")
        if topic and from_file:
            remove_topic(topic)

    print("5/5 Done")
    history.append(entry)
    HISTORY.write_text(json.dumps(history, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
