import unittest
import requests
import csv
import time
import os
from datetime import datetime
from pathlib import Path

# ================== CONFIG ==================
API_URL = os.getenv(
    "TYLER_API_URL",
    "https://baemh7buri.execute-api.us-east-1.amazonaws.com/default/PrismaAIRS-VoiceAgent"
)
PROMPTS_CSV = Path(__file__).parent / "test_prompts.csv"
OUTPUT_CSV  = Path(__file__).parent / "prisma_airs_test_results.csv"
DELAY       = 1.8   # seconds between requests to avoid throttling
TIMEOUT     = 40    # request timeout in seconds
# ===========================================


def load_prompts(csv_path: Path) -> list[dict]:
    """Load test prompts from CSV. Expected columns: id, prompt, category."""
    with open(csv_path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def send_prompt(prompt: str) -> dict:
    """POST a single prompt to the Tyler API and return response metadata."""
    start = time.time()
    try:
        resp = requests.post(
            API_URL,
            headers={"Content-Type": "application/json"},
            json={"text": prompt},
            timeout=TIMEOUT,
        )
        latency_ms = round((time.time() - start) * 1000, 2)
        return {
            "status_code": resp.status_code,
            "latency_ms": latency_ms,
            "audio_size_bytes": len(resp.content),
            "error": "",
        }
    except Exception as exc:
        return {
            "status_code": "ERROR",
            "latency_ms": 0,
            "audio_size_bytes": 0,
            "error": str(exc),
        }


# ─── Unit Tests ───────────────────────────────────────────────────────────────

class TestPrismaAIRSIntegration(unittest.TestCase):
    """
    Integration tests for the Tyler AI agent secured with Prisma AIRS.
    Each test sends a prompt and asserts the API returns HTTP 200.
    Results (latency, audio size, errors) are written to OUTPUT_CSV.
    """

    @classmethod
    def setUpClass(cls):
        cls.prompts = load_prompts(PROMPTS_CSV)
        cls.results = []
        # Open CSV writer once for the whole test run
        cls._csv_file = open(OUTPUT_CSV, "w", newline="", encoding="utf-8")
        cls._writer = csv.DictWriter(
            cls._csv_file,
            fieldnames=["id", "prompt", "category", "status_code",
                        "latency_ms", "audio_size_bytes", "error", "timestamp"],
        )
        cls._writer.writeheader()

    @classmethod
    def tearDownClass(cls):
        cls._csv_file.close()
        # Print summary
        total   = len(cls.results)
        ok      = sum(1 for r in cls.results if r["status_code"] == 200)
        errors  = sum(1 for r in cls.results if r["error"])
        avg_lat = (sum(r["latency_ms"] for r in cls.results) / total) if total else 0
        print(f"\n{'='*55}")
        print(f"  Total prompts tested : {total}")
        print(f"  HTTP 200 responses   : {ok}")
        print(f"  Errors               : {errors}")
        print(f"  Avg latency          : {avg_lat:.0f} ms")
        print(f"  Results saved to     : {OUTPUT_CSV}")
        print(f"{'='*55}")

    def _run_prompt(self, row: dict):
        """Helper: send prompt, record result, assert HTTP 200."""
        result = send_prompt(row["prompt"])
        record = {
            "id":               row["id"],
            "prompt":           row["prompt"],
            "category":         row["category"],
            "status_code":      result["status_code"],
            "latency_ms":       result["latency_ms"],
            "audio_size_bytes": result["audio_size_bytes"],
            "error":            result["error"],
            "timestamp":        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        self.__class__._writer.writerow(record)
        self.__class__.results.append(record)
        print(
            f"  [{row['id']}] {result['status_code']} | "
            f"{result['latency_ms']:7.1f}ms | "
            f"{result['audio_size_bytes']:6,} bytes | "
            f"{row['prompt'][:70]}..."
        )
        self.assertEqual(
            result["status_code"], 200,
            msg=f"Prompt {row['id']} returned {result['status_code']}: {result['error']}"
        )
        time.sleep(DELAY)


def _make_test(row: dict):
    """Dynamically generate a test method for a single prompt row."""
    def test_method(self):
        self._run_prompt(row)
    test_method.__name__ = f"test_{row['id']}"
    test_method.__doc__  = f"[{row['category']}] {row['prompt'][:80]}"
    return test_method


# Dynamically attach one test per prompt so each shows up individually in the runner
for _row in load_prompts(PROMPTS_CSV):
    _test = _make_test(_row)
    setattr(TestPrismaAIRSIntegration, _test.__name__, _test)


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"\n🚀 Running {len(load_prompts(PROMPTS_CSV))} prompt tests against:\n   {API_URL}\n")
    unittest.main(verbosity=2)
