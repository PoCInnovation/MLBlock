#!/usr/bin/env python3
"""Sonde manuelle fine d'un rent GPU — même logique que le backend (execute),
mais polling 5 s + détail Vast v1 + timestamps de chaque phase.

Usage :
  SMOKE_JWT=<jwt> VAST_API_KEY=<clé> uv run python scripts/vast_manual_probe.py \
    --base http://backend.141.253.110.210.sslip.io [--cuda] [--keep] [--budget-min 35]
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

BASE = sys.argv[sys.argv.index("--base") + 1] if "--base" in sys.argv else "http://localhost:8000"
JWT = os.environ.get("SMOKE_JWT", "")
VAST_API_KEY = os.environ.get("VAST_API_KEY", "")
CUDA = "--cuda" in sys.argv
KEEP = "--keep" in sys.argv
BUDGET = int(sys.argv[sys.argv.index("--budget-min") + 1] if "--budget-min" in sys.argv else 35) * 60

T0 = time.monotonic()


def ts():
    return f"{time.monotonic() - T0:7.1f}s"


def api(path, method="GET", body=None, timeout=30):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data,
        headers={"Authorization": f"Bearer {JWT}", "Content-Type": "application/json"}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            try:
                return r.status, json.loads(raw)
            except Exception:
                return r.status, {}
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}


def vast(path, method="GET", params=None, timeout=20):
    url = f"https://console.vast.ai/api/v0{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {VAST_API_KEY}"}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {}


def vast_detail(iid):
    code, d = vast("/v1/instances", params={
        "select_cols": json.dumps(["id", "actual_status", "cur_state", "status_msg", "gpu_util", "gpu_name", "dph_total", "uptime_mins"]),
        "select_filters": json.dumps({"id": {"eq": int(iid)}}),
    })
    insts = (d.get("instances") or []) if code == 200 else []
    return insts[0] if insts else None


def N(i, t, params=None):
    return {"id": f"n{i}", "type": t, "params": params or {}, "children": [],
            "position": {"x": i * 240, "y": 100}}


def E(s, t, sp="out_1", tp="in_1"):
    return {"source": f"n{s}", "source_port": sp, "target": f"n{t}", "target_port": tp}


def main():
    if CUDA:
        name = "probe-cuda"
        nodes = [N(1, "load_torch_dataset", {"name": "mnist", "batch_size": "512"}), N(2, "flatten_layer", {}), N(3, "linear_layer", {"in_features": "784", "out_features": "10"}), N(4, "adam", {}), N(5, "cross_entropy_loss", {}), N(6, "train_model", {"epochs": "1"}), N(7, "data_loader", {"batch_size": "512"})]
        edges = [E(1, 7, tp="in_1"), E(7, 6, tp="in_2"), E(2, 3), E(3, 6, tp="in_1"), E(3, 4, tp="in_1"), E(4, 6, tp="in_3"), E(5, 6, tp="in_4")]
    else:
        name = "probe-slim"
        nodes = [N(1, "load_sklearn_dataset", {"name": "iris"}), N(2, "train_test_split", {"ratio": "0.7"}),
                 N(3, "random_forest", {"target_column": "target"}), N(4, "evaluate", {"target_column": "target", "method": "accuracy"})]
        edges = [E(1, 2, tp="dataset"), E(2, 3, sp="out_1", tp="train_data"),
                 E(2, 4, sp="out_2", tp="test_data"), E(3, 4, tp="model")]
    _, pipe = api("/api/pipelines", "POST", {"name": name, "is_draft": False, "nodes": nodes, "edges": edges})
    t_exec = time.monotonic()
    _, job = api(f"/api/pipelines/{pipe['id']}/execute", "POST", {}, timeout=120)
    jid, iid = job["id"], job.get("vast_instance_id", "")
    print(f"[{ts()}] execute OK en {time.monotonic() - t_exec:.1f}s — job={jid} instance={iid}", flush=True)
    if not iid or iid in ("local-instance-id", "mock-instance-id", "dummy-instance-id"):
        print("pas d'instance réelle, stop")
        return 1
    last_outs, last_status, last_vast = -1, None, None
    try:
        while time.monotonic() - T0 < BUDGET:
            time.sleep(5)
            _, js = api(f"/api/jobs/{jid}")
            _, outs = api(f"/api/jobs/{jid}/outputs")
            det = vast_detail(iid)
            vline = ""
            if det:
                vline = f" vast={det.get('actual_status')}/{det.get('cur_state')} gpu={det.get('gpu_util')} up={det.get('uptime_mins')} msg={str(det.get('status_msg'))[:70]}"
                if det.get("actual_status") != last_vast:
                    print(f"[{ts()}] VAST{vline}", flush=True)
                    last_vast = det.get("actual_status")
            if isinstance(outs, list) and len(outs) != last_outs:
                for o in outs[max(0, last_outs):]:
                    print(f"[{ts()}] out [{o.get('block_name')}] {str(o.get('output'))[:130]}", flush=True)
                last_outs = len(outs)
            if js.get("status") != last_status:
                print(f"[{ts()}] job status: {last_status} -> {js.get('status')}", flush=True)
                last_status = js.get("status")
            else:
                print(f"[{ts()}] job={js.get('status')} outs={len(outs) if isinstance(outs, list) else '?'}", flush=True)
            if js.get("status") in ("done", "error", "cancelled"):
                print(f"[{ts()}] FINAL: {js.get('status')} err={str(js.get('error'))[:200]}", flush=True)
                return 0 if js.get("status") == "done" else 1
        print(f"[{ts()}] BUDGET dépassé, job toujours {last_status}")
        return 1
    finally:
        c, _ = vast(f"/instances/{iid}/", method="DELETE")
        print(f"[{ts()}] destroy secours -> {c}", flush=True)
        if KEEP:
            print(f"--keep : pipeline {pipe['id']} job {jid} conservés")
        else:
            try:
                api(f"/api/pipelines/{pipe['id']}", "DELETE")
            except Exception:
                pass


if __name__ == "__main__":
    print(f"Démarrage {datetime.now(timezone.utc).isoformat()} cuda={CUDA}", flush=True)
    raise SystemExit(main())
