#!/usr/bin/env python3
"""Phase 1 — tight feedback loop for Vast.ai GPU callback bug.

Symptom: POST /api/pipelines/{id}/execute → 200, job status never leaves
'dispatched', no POST /api/jobs/{id}/status|output|error ever appears
in backend logs (or appears as 403). Polling GET /api/jobs/{id} stays 200.

Root cause under test: generated code prefers GPU_API_KEY env over
CONTAINER_API_KEY, but backend verify_gpu_key expects job.instance_api_key
(== CONTAINER_API_KEY) when set → GPU sends shared secret → 403 → callbacks
silently dropped (except: pass) → job hangs forever.

Tight loop criteria:
- red-capable: asserts exact symptom (auth priority inversion)
- deterministic: no network, no Supabase, pure unit on generator + auth logic
- fast: <1s
- agent-runnable: `uv run python scripts/repro_vast_auth.py`

Exit 0 = green (bug fixed), Exit 1 = red (bug reproduced).
"""
from __future__ import annotations

import os
import sys

# Ensure imports work without full env
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SECRET_KEY", "sb_secret_mock")
os.environ.setdefault("SUPABASE_JWKS_URL", "https://example.supabase.co/auth/v1/.well-known/jwks.json")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from mlblock.core.generator import generate_code
from mlblock.server.schemas import PipelineNode

def test_auth_priority():
    """Generated code MUST prefer CONTAINER_API_KEY over GPU_API_KEY."""
    code = generate_code(
        [PipelineNode(id="n1", type="load_csv", params={"path": "data.csv"})],
        [],
    )
    # Find the GPU_API_KEY assignment line
    gpu_line = next((l for l in code.split("\n") if "GPU_API_KEY" in l and "os.environ" in l), "")
    if not gpu_line:
        print("FAIL: GPU_API_KEY line not found in generated code")
        return False

    print(f"  Generated line: {gpu_line.strip()}")

    # Correct order: CONTAINER_API_KEY first
    correct = "os.environ.get('CONTAINER_API_KEY') or os.environ.get('GPU_API_KEY'"
    buggy = "os.environ.get('GPU_API_KEY') or os.environ.get('CONTAINER_API_KEY'"

    if correct in gpu_line:
        print("  PASS: prefers CONTAINER_API_KEY (correct)")
        return True
    if buggy in gpu_line:
        print("  FAIL: prefers GPU_API_KEY over CONTAINER_API_KEY (BUG)")
        print("        → GPU will send shared secret, backend expects instance_api_key (CONTAINER_API_KEY)")
        print("        → POST /api/jobs/{id}/status returns 403, swallowed by `except: pass`")
        print("        → job stays 'dispatched' forever — matches user logs (no POST status seen)")
        return False
    print(f"  FAIL: unexpected auth line shape: {gpu_line}")
    return False


def test_container_wins_simulation():
    """Simulate what container would send vs what backend expects."""
    shared = "shared-gpu-secret-123"
    instance = "vast-instance-restricted-key-xyz"

    # Simulate container env after Vast injects CONTAINER_API_KEY
    container_env = {"GPU_API_KEY": shared, "CONTAINER_API_KEY": instance}

    # Current buggy logic in generated code:
    # GPU_API_KEY = os.environ.get('GPU_API_KEY') or os.environ.get('CONTAINER_API_KEY', ...)
    buggy_sent = container_env.get("GPU_API_KEY") or container_env.get("CONTAINER_API_KEY", "mock")
    # Correct logic:
    # GPU_API_KEY = os.environ.get('CONTAINER_API_KEY') or os.environ.get('GPU_API_KEY', ...)
    correct_sent = container_env.get("CONTAINER_API_KEY") or container_env.get("GPU_API_KEY", "mock")

    backend_expected = instance  # job.instance_api_key == CONTAINER_API_KEY
    print(f"  Container env: GPU_API_KEY=<REDACTED> CONTAINER_API_KEY=<REDACTED>")
    print(f"  Backend expects: <REDACTED-instance>")
    print(f"  Buggy code would send:  {'<REDACTED-shared>' if buggy_sent==shared else buggy_sent} -> match={buggy_sent==backend_expected}")
    print(f"  Correct code would send: {'<REDACTED-instance>' if correct_sent==instance else correct_sent} -> match={correct_sent==backend_expected}")

    # This test documents the bug; actual pass/fail is test_auth_priority
    return True


def test_onstart_length():
    """Sanity: onstart script exceeds 4048 chars and triggers gzip branch."""
    code = generate_code(
        [PipelineNode(id="n1", type="load_csv", params={"path": "data.csv"})],
        [],
    )
    env_str = " ".join(f"{k}='{v}'" for k, v in {
        "BACKEND_URL": "http://backend.141.253.110.210.sslip.io",
        "GPU_API_KEY": "shared",
        "JOB_ID": "00000000-0000-0000-0000-000000000000",
        "BACKEND_TIMEOUT": "90",
    }.items())
    deps = "pip install -q --disable-pip-version-check scikit-learn gymnasium torchvision pandas requests"
    onstart = deps + " && " + env_str + " python - << 'MLBLOCK_EOF'\n" + code + "\nMLBLOCK_EOF"
    print(f"  onstart length: {len(onstart)} (threshold 4048)")
    if len(onstart) > 4048:
        print("  INFO: will be gzip+base64 encoded via VastAI._encode_onstart")
        from mlblock.core.vast import VastAI
        encoded = VastAI._encode_onstart(onstart)
        if encoded != onstart:
            import base64, gzip, re
            # New format: echo '<b64>' | base64 -d | gunzip | bash
            m = re.search(r"echo '([^']+)'", encoded)
            b64 = m.group(1) if m else encoded
            try:
                decoded = gzip.decompress(base64.b64decode(b64)).decode()
            except Exception as e:
                print(f"  FAIL: decode error {e}")
                return False
            assert decoded == onstart, "gzip roundtrip broken"
            if m:
                assert "base64 -d | gunzip | bash" in encoded, "wrapper missing decode pipe"
                print("  PASS: gzip+base64 wrapper roundtrip ok (echo | base64 -d | gunzip | bash)")
            else:
                print("  PASS: gzip+base64 roundtrip ok (legacy plain)")
        else:
            print("  WARN: not encoded despite >4048")


if __name__ == "__main__":
    print("=== Vast.ai GPU callback — tight feedback loop ===\n")
    print("[1] Auth priority (codegen vs backend expectation):")
    ok_auth = test_auth_priority()
    print()
    print("[2] Container simulation (shared vs instance key):")
    test_container_wins_simulation()
    print()
    print("[3] onstart encoding sanity:")
    test_onstart_length()
    print()
    if ok_auth:
        print("RESULT: GREEN — auth priority fixed (CONTAINER_API_KEY preferred)")
        sys.exit(0)
    else:
        print("RESULT: RED — bug reproduced (GPU_API_KEY preferred over CONTAINER_API_KEY)")
        print("       Symptom matches user logs: POST /execute 200 but no POST /status|output seen,")
        print("       polling GET /jobs/{id} 200 forever (dispatched never → done).")
        sys.exit(1)
