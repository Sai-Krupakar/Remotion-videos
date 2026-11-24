"""Generate per-line narration WAVs and timings for a staged story script.

Voices are chosen in the script JSON ("voice", "voiceSpeed", and per-line overrides)
or with --voice / --speed. Voice ids:
  piper:<model>   offline neural voice from the voices/ folder, e.g. piper:en_GB-alan-medium
  windows:<name>  built-in Windows voice, e.g. windows:David or windows:Zira

Usage:
  python scripts/create_narration.py --list-voices
  python scripts/create_narration.py --name little-seed [--voice piper:en_GB-alan-medium] [--speed 1.1] [--overwrite]
"""

from __future__ import annotations

import argparse
import array
import json
import os
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICES_DIR = ROOT / "voices"
DEFAULT_VOICE = "piper:en_US-ryan-medium"
EDGE_PADDING_SECONDS = 0.04
SILENCE_THRESHOLD = 500

_piper_cache: dict[str, object] = {}


def list_voices() -> list[str]:
    voices = sorted(f"piper:{p.name[:-5]}" for p in VOICES_DIR.glob("*.onnx"))
    if sys.platform == "win32":
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             "Add-Type -AssemblyName System.Speech; "
             "(New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices()"
             " | ForEach-Object { $_.VoiceInfo.Name }"],
            capture_output=True, text=True, check=False,
        )
        for name in result.stdout.split("\n"):
            name = name.strip()
            if name:
                voices.append(f"windows:{name.replace('Microsoft ', '').replace(' Desktop', '')}")
    return voices


def synth_piper(model: str, text: str, speed: float, out: Path) -> None:
    from piper import PiperVoice, SynthesisConfig

    path = VOICES_DIR / f"{model}.onnx"
    if not path.exists():
        raise SystemExit(f"Piper voice not found: {path}. Run --list-voices to see installed voices.")
    if model not in _piper_cache:
        _piper_cache[model] = PiperVoice.load(str(path))
    voice = _piper_cache[model]
    with wave.open(str(out), "wb") as wav_file:
        voice.synthesize_wav(text, wav_file, syn_config=SynthesisConfig(length_scale=1 / speed))  # type: ignore[attr-defined]


def synth_windows(name: str, text: str, speed: float, out: Path) -> None:
    # System.Speech rate is -10..10; map speed 1.0 -> 0, 1.5 -> 5.
    rate = max(-10, min(10, round((speed - 1) * 10)))
    env = {**os.environ, "NARRATION_TEXT": text, "NARRATION_OUT": str(out), "NARRATION_VOICE": name}
    command = (
        "Add-Type -AssemblyName System.Speech; "
        "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        "$v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -like ('*' + $env:NARRATION_VOICE + '*') } | Select-Object -First 1; "
        "if (-not $v) { throw ('Windows voice not found: ' + $env:NARRATION_VOICE) }; "
        f"$s.SelectVoice($v.VoiceInfo.Name); $s.Rate = {rate}; "
        "$s.SetOutputToWaveFile($env:NARRATION_OUT); $s.Speak($env:NARRATION_TEXT); $s.Dispose()"
    )
    subprocess.run(["powershell", "-NoProfile", "-Command", command], env=env, check=True)


def synthesize(voice: str, text: str, speed: float, out: Path) -> None:
    engine, _, name = voice.partition(":")
    if engine == "piper":
        synth_piper(name, text, speed, out)
    elif engine == "windows":
        synth_windows(name, text, speed, out)
    else:
        raise SystemExit(f'Unknown voice "{voice}". Use piper:<model> or windows:<name>.')


def trim_silence(source: Path, target: Path) -> float:
    """Removes leading/trailing silence so consecutive lines flow without gaps. Returns seconds."""
    with wave.open(str(source), "rb") as wav_in:
        params = wav_in.getparams()
        frames = wav_in.readframes(params.nframes)
    if params.sampwidth != 2:
        target.write_bytes(source.read_bytes())
        return params.nframes / params.framerate
    samples = array.array("h", frames)
    channels = params.nchannels
    loud = [i for i in range(0, len(samples), channels) if abs(samples[i]) > SILENCE_THRESHOLD]
    pad = int(EDGE_PADDING_SECONDS * params.framerate) * channels
    start = max(0, loud[0] - pad) if loud else 0
    end = min(len(samples), loud[-1] + channels + pad) if loud else len(samples)
    trimmed = samples[start:end]
    with wave.open(str(target), "wb") as wav_out:
        wav_out.setnchannels(channels)
        wav_out.setsampwidth(2)
        wav_out.setframerate(params.framerate)
        wav_out.writeframes(trimmed.tobytes())
    return len(trimmed) / channels / params.framerate


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--name", default="little-seed", help="story name; reads src/stories/<name>-script.json")
    parser.add_argument("--voice", help="override the script's narrator voice")
    parser.add_argument("--speed", type=float, help="override the script's voiceSpeed (1.0 = normal)")
    parser.add_argument("--overwrite", action="store_true", help="replace existing narration for this story")
    parser.add_argument("--list-voices", action="store_true")
    args = parser.parse_args()

    if args.list_voices:
        print("\n".join(list_voices()))
        return

    script_path = ROOT / "src" / "stories" / f"{args.name}-script.json"
    audio_dir = ROOT / "public" / "audio" / args.name
    timing_path = ROOT / "src" / "stories" / f"{args.name}-timings.json"
    transcript_path = ROOT / "outputs" / f"{args.name}-script.txt"
    if not args.overwrite and (audio_dir.exists() or timing_path.exists()):
        raise SystemExit("Narration already exists. Re-run with --overwrite to replace it.")

    story = json.loads(script_path.read_text(encoding="utf-8-sig"))
    generate_narration(story, audio_dir, timing_path, transcript_path, args.voice, args.speed)


def generate_narration(
    story: dict, audio_dir: Path, timing_path: Path, transcript_path: Path,
    voice_override: str | None = None, speed_override: float | None = None,
) -> list[dict]:
    """Writes <sceneId>-<n>.wav clips, the timings JSON and a transcript; returns the timings."""
    narrator = voice_override or story.get("voice") or DEFAULT_VOICE
    base_speed = speed_override or story.get("voiceSpeed") or 1.0
    audio_dir.mkdir(parents=True, exist_ok=True)
    transcript_path.parent.mkdir(parents=True, exist_ok=True)
    timing_path.parent.mkdir(parents=True, exist_ok=True)

    timings = []
    transcript = [story["title"], f"Narrator: {narrator} @ {base_speed}x", ""]
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / "raw.wav"
        for scene in story["scenes"]:
            durations = []
            transcript.append(f"[{scene['id']}]")
            for index, line in enumerate(scene["lines"]):
                entry = {"text": line} if isinstance(line, str) else line
                voice = entry.get("voice") or narrator
                speed = entry.get("voiceSpeed") or base_speed
                synthesize(voice, entry["text"], speed, raw)
                seconds = round(trim_silence(raw, audio_dir / f"{scene['id']}-{index + 1}.wav"), 3)
                durations.append(seconds)
                transcript.append(f"{entry['text']}  ({voice}, {seconds}s)")
                print(f"{scene['id']}-{index + 1}: {seconds}s  {voice}")
            transcript.append("")
            timings.append({"id": scene["id"], "durations": durations})

    timing_path.write_text(json.dumps(timings, indent=2) + "\n", encoding="utf-8")
    transcript_path.write_text("\n".join(transcript) + "\n", encoding="utf-8")
    total = sum(sum(t["durations"]) for t in timings)
    print(f"Generated {sum(len(t['durations']) for t in timings)} lines, {total:.1f}s of speech.")
    return timings


if __name__ == "__main__":
    main()
