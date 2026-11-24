import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from generate import main, make_captions, parse_plan, srt_time


class PlanTests(unittest.TestCase):
    def test_extracts_json_and_normalizes_fields(self):
        result = parse_plan('```json\n{"narration":"Leaves turn red.", "visual":"A tree"}\n```')
        self.assertEqual(result, {"narration": "Leaves turn red.", "visual": "A tree"})

    def test_rejects_missing_visual(self):
        with self.assertRaises(ValueError):
            parse_plan('{"narration":"Hello"}')

    def test_extracts_markdown_model_response(self):
        response = (
            "**Narration:** \nIn the fall, leaves change from green to yellow, "
            "red, and eventually fall off the trees.\n\n"
            "**Visual:** \nA close-up shot of a tree branch showing its leaves "
            "changing colors as autumn approaches."
        )
        result = parse_plan(response)
        self.assertEqual(
            result["narration"],
            "In the fall, leaves change from green to yellow, red, and eventually fall off the trees.",
        )
        self.assertTrue(result["visual"].startswith("A close-up shot"))

    def test_rejects_missing_markdown_field(self):
        with self.assertRaises(ValueError):
            parse_plan("**Narration:** Hello")

    def test_rejects_excessive_narration(self):
        with self.assertRaises(ValueError):
            parse_plan('{"narration":"' + "word " * 19 + '", "visual":"tree"}')


class CaptionTests(unittest.TestCase):
    def test_caption_timing_covers_audio(self):
        captions = make_captions("One two", 2.0)
        self.assertIn("00:00:00,000 --> 00:00:01,000\nOne", captions)
        self.assertIn("00:00:01,000 --> 00:00:02,000\ntwo", captions)

    def test_time_carries_into_next_minute(self):
        self.assertEqual(srt_time(59.9996), "00:01:00,000")

    def test_rejects_empty_narration(self):
        with self.assertRaises(ValueError):
            make_captions("", 2)


@unittest.skipUnless(sys.platform == "win32", "Narration uses Windows speech synthesis")
class AssemblyTests(unittest.TestCase):
    def test_assembles_narration_captions_and_portrait_video(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "result.mp4"

            def sample_video(_visual, path, _steps, _seed):
                subprocess.run(
                    [
                        "ffmpeg", "-v", "error", "-f", "lavfi", "-i",
                        "color=c=blue:s=720x480:r=8", "-t", "1",
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", str(path),
                    ],
                    check=True,
                )

            with (
                patch("sys.argv", ["generate.py", "--topic", "test", "--output", str(output)]),
                patch("generate.make_plan", return_value={"narration": "Leaves change color.", "visual": "A tree"}),
                patch("generate.make_video", side_effect=sample_video),
            ):
                main()
            result = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height",
                 "-of", "json", str(output)],
                check=True, capture_output=True, text=True,
            )
            streams = json.loads(result.stdout)["streams"]
            self.assertTrue(any(s.get("width") == 720 and s.get("height") == 1280 for s in streams))
            self.assertTrue(any(s["codec_type"] == "audio" for s in streams))


if __name__ == "__main__":
    unittest.main()
