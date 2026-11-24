import argparse
import gc
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
TEXT_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
VIDEO_MODEL = "zai-org/CogVideoX-2b"


def parse_plan(response: str) -> dict[str, str]:
    start = response.find("{")
    if start >= 0:
        plan, _ = json.JSONDecoder().raw_decode(response[start:])
    else:
        heading = r"(?im)^\s*(?:\*\*)?{}\s*(?::\s*(?:\*\*)?|(?:\*\*)\s*:)\s*"
        narration = re.search(heading.format("narration"), response)
        visual = re.search(heading.format("visual"), response)
        if not narration or not visual or narration.end() > visual.start():
            raise ValueError("The language model did not provide narration and visual fields.")
        plan = {
            "narration": response[narration.end():visual.start()],
            "visual": response[visual.end():],
        }
    if not isinstance(plan, dict):
        raise ValueError("The language model must return an object.")
    for key in ("narration", "visual"):
        if not isinstance(plan.get(key), str) or not plan[key].strip():
            raise ValueError(f'The language model did not provide "{key}".')
        plan[key] = " ".join(plan[key].split())
    if len(plan["narration"].split()) > 18:
        raise ValueError("The narration exceeds the 18-word limit for this short demo.")
    return {"narration": plan["narration"], "visual": plan["visual"]}


def make_plan(topic: str) -> dict[str, str]:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL)
    model = AutoModelForCausalLM.from_pretrained(TEXT_MODEL, torch_dtype=torch.float32)
    messages = [
        {
            "role": "system",
            "content": (
                "You create short educational videos. Respond with only valid JSON "
                'containing two strings: "narration" and "visual". Narration must '
                "be one factual sentence of at most 15 words. Visual must describe "
                "one concrete camera shot illustrating that sentence, without text. "
                "Avoid medical, survival, legal or other consequential advice."
            ),
        },
        {"role": "user", "content": f"Make a short video about: {topic}"},
    ]
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(prompt, return_tensors="pt")
    with torch.inference_mode():
        result = model.generate(
            **inputs,
            max_new_tokens=180,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )
    response = tokenizer.decode(result[0, inputs["input_ids"].shape[1]:], skip_special_tokens=True)
    plan = parse_plan(response)
    del model, tokenizer, inputs, result
    gc.collect()
    return plan


def srt_time(seconds: float) -> str:
    millis = max(0, round(seconds * 1000))
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def make_captions(narration: str, duration: float) -> str:
    words = narration.split()
    if not words or duration <= 0:
        raise ValueError("Caption text and audio duration must be nonempty.")
    entries = []
    for index, word in enumerate(words):
        start = duration * index / len(words)
        end = duration * (index + 1) / len(words)
        safe_word = word.replace("-->", "").replace("<", "").replace(">", "")
        entries.append(f"{index + 1}\n{srt_time(start)} --> {srt_time(end)}\n{safe_word}\n")
    return "\n".join(entries)


def make_video(visual: str, path: Path, steps: int, seed: int) -> None:
    import torch
    from diffusers import CogVideoXPipeline
    from diffusers.utils import export_to_video

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is unavailable. Install the CUDA-enabled PyTorch dependencies.")
    pipe = CogVideoXPipeline.from_pretrained(VIDEO_MODEL, torch_dtype=torch.float16)
    pipe.enable_sequential_cpu_offload()
    pipe.vae.enable_slicing()
    pipe.vae.enable_tiling()
    prompt = (
        "A realistic 3D animated educational video, cinematic lighting, "
        "no text, no captions. " + visual
    )
    frames = pipe(
        prompt=prompt,
        num_videos_per_prompt=1,
        num_inference_steps=steps,
        num_frames=49,
        guidance_scale=6,
        generator=torch.Generator(device="cuda").manual_seed(seed),
    ).frames[0]
    export_to_video(frames, str(path), fps=8)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate an experimental short video locally.")
    parser.add_argument("--topic", required=True, help="Topic for a short educational video")
    parser.add_argument("--output", type=Path, help="Output MP4; existing files are not overwritten")
    parser.add_argument("--steps", type=int, default=20, help="Video diffusion steps (default: 20)")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    topic = args.topic.strip()
    if not topic or args.steps < 1:
        parser.error("Provide a nonempty topic and at least one generation step.")
    for executable in ("ffmpeg", "ffprobe", "powershell"):
        if not shutil.which(executable):
            raise RuntimeError(f"{executable} was not found on PATH.")
    slug = re.sub(r"[^a-z0-9]+", "-", topic.lower()).strip("-")[:48] or "video"
    output = (args.output or ROOT / "outputs" / f"local-{slug}.mp4").resolve()
    if output.exists():
        raise FileExistsError(f"Output already exists: {output}")
    output.parent.mkdir(parents=True, exist_ok=True)

    import truststore

    truststore.inject_into_ssl()
    print("Writing a short script locally...", flush=True)
    plan = make_plan(topic)
    print(f'Narration: {plan["narration"]}', flush=True)
    print(f'Visual: {plan["visual"]}', flush=True)
    print("Review generated facts before sharing the finished video.", flush=True)

    with tempfile.TemporaryDirectory(prefix="local-video-") as directory:
        work = Path(directory)
        plan_path = work / "plan.json"
        plan_path.write_text(json.dumps(plan, ensure_ascii=False), encoding="utf-8")
        audio = work / "narration.wav"
        subprocess.run(
            [
                "powershell", "-NoProfile", "-NonInteractive", "-File",
                str(ROOT / "local-video" / "narrate.ps1"),
                "-PlanPath", str(plan_path), "-OutputPath", str(audio),
            ],
            check=True,
        )
        probe = subprocess.run(
            [
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", str(audio),
            ],
            check=True, capture_output=True, text=True,
        )
        duration = float(probe.stdout.strip())
        (work / "captions.srt").write_text(
            make_captions(plan["narration"], duration), encoding="utf-8"
        )
        print("Generating a single short video clip; this can take a long time...", flush=True)
        clip = work / "clip.mp4"
        make_video(plan["visual"], clip, args.steps, args.seed)
        filters = (
            "crop=ih*9/16:ih,scale=720:1280,"
            "tpad=stop_mode=clone:stop_duration=30,"
            "subtitles=captions.srt:force_style='FontName=Arial,FontSize=18,"
            "PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=65'"
        )
        subprocess.run(
            [
                "ffmpeg", "-v", "error", "-nostdin", "-n",
                "-i", str(clip), "-i", str(audio), "-vf", filters,
                "-map", "0:v:0", "-map", "1:a:0", "-t", str(duration),
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
                "-movflags", "+faststart", str(output),
            ],
            cwd=work, check=True,
        )
    print(f"Video saved to: {output}", flush=True)


if __name__ == "__main__":
    main()
