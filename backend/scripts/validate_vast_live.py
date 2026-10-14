#!/usr/bin/env python3
"""Smoke live Vast.ai — valide la théorie avant implémentation (template/cheap/reaper).

Théorie testée (code actuel, branche dev/chedli) :
  rent 3090 + image ghcr slim → boot → onstart bootstrap (< 4 Ko)
  → uv install → GET /jobs/{id}/code → python3 main.py
  → callbacks status/output → done → destroy (backend + _self_destroy).

Ne teste PAS (pas encore implémenté) : template_hash_id, offre cheap, reaper.

Préconditions opérateur :
  1. Serveur local sur CE code :  MLBLOCK_RUN_MODE=gpu  VAST_API_KEY=<vraie clé>
     BACKEND_URL=<URL publique joignable depuis Vast>  (tunnel, PAS localhost)
     GPU_API_KEY=<secret>  (+ autres env Supabase/DATABASE_URL habituels)
     $ uv run uvicorn mlblock.server.main:app --host 0.0.0.0 --port 8000
  2. NE PAS viser le backend Coolify déployé : il suit `main`, pas cette branche.
     Le test doit tourner contre un serveur local sur CE code (ou après merge+redeploy).
  3. Coût estimé : ~0,10-0,30 $ (3090, quelques minutes). Destroy garanti en finally.

Usage :
  SMOKE_JWT=<jwt> uv run python scripts/validate_vast_live.py [--base http://localhost:8000] [--keep] [--cuda]
  --cuda : pipeline MNIST torch -> template CUDA (RTX 3090), prouve le chemin template.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = sys.argv[sys.argv.index("--base") + 1] if "--base" in sys.argv else "http://localhost:8000"
KEEP = "--keep" in sys.argv
CUDA = "--cuda" in sys.argv  # pipeline torch MNIST -> chemin template CUDA (RTX 3090)
JWT = os.environ.get("SMOKE_JWT", "")
VAST_API_KEY = os.environ.get("VAST_API_KEY", "")
POLL_STATUS = 60  # 60 x 30 s = 30 min max (template : pull image + install + train)
POLL_DESTROY = 12  # 12 x 10 s = 2 min pour constater la destruction


def api(path, method="GET", body=None, timeout=60):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={"Authorization": f"Bearer {JWT}", "Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}


def vast_get(path, timeout=15):
    req = urllib.request.Request(
        f"https://console.vast.ai/api/v0{path}",
        headers={"Authorization": f"Bearer {VAST_API_KEY}"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}


def vast_instance_detail(iid):
    import urllib.parse as _up

    code, d = vast_get("/v1/instances?" + _up.urlencode({
        "select_cols": json.dumps(["id", "actual_status", "status_msg", "gpu_util", "cur_state"]),
        "select_filters": json.dumps({"id": {"eq": int(iid)}}),
    }))
    insts = (d.get("instances") or []) if code == 200 else []
    return code, (insts[0] if insts else None)


def vast_delete_instance(instance_id):
    req = urllib.request.Request(
        f"https://console.vast.ai/api/v0/instances/{instance_id}/",
        headers={"Authorization": f"Bearer {VAST_API_KEY}"},
        method="DELETE",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


def main():
    if not JWT:
        print("SMOKE_JWT manquant")
        return 1
    if not VAST_API_KEY or VAST_API_KEY.startswith("mock"):
        print("VAST_API_KEY réelle requise (cleanup de secours + vérif destroy)")
        return 1
    status, health = api("/healthz")
    if status != 200:
        status, health = api("/api/health")
    if status != 200:
        print(f"Backend injoignable sur {BASE} : {status}")
        return 1
    print(f"Backend OK sur {BASE} : {health}")

    # Pipeline Iris minimal (sklearn, secondes sur slim) — cf. validate_exercises.py
    # --cuda : exo MNIST torch (5.2) -> chemin template CUDA.
    def N(i, t, params=None):
        return {"id": f"n{i}", "type": t, "params": params or {}, "children": [],
                "position": {"x": i * 240, "y": 100}}

    def E(s, t, sp="out_1", tp="in_1"):
        return {"source": f"n{s}", "source_port": sp, "target": f"n{t}", "target_port": tp}

    if CUDA:
        name = "smoke-vast-live-cuda"
        nodes = [N(1, "load_torch_dataset", {"name": "mnist", "batch_size": "512"}), N(2, "flatten_layer", {}), N(3, "linear_layer", {"in_features": "784", "out_features": "10"}), N(4, "adam", {}), N(5, "cross_entropy_loss", {}), N(6, "train_model", {"epochs": "1"}), N(7, "data_loader", {"batch_size": "512"})]
        edges = [E(1, 7, tp="in_1"), E(7, 6, tp="in_2"), E(2, 3), E(3, 6, tp="in_1"), E(3, 4, tp="in_1"), E(4, 6, tp="in_3"), E(5, 6, tp="in_4")]
    else:
        name = "smoke-vast-live"
        nodes = [N(1, "load_sklearn_dataset", {"name": "iris"}), N(2, "train_test_split", {"ratio": "0.7"}),
                 N(3, "random_forest", {"target_column": "target"}), N(4, "evaluate", {"target_column": "target", "method": "accuracy"})]
        edges = [E(1, 2, tp="dataset"), E(2, 3, sp="out_1", tp="train_data"),
                 E(2, 4, sp="out_2", tp="test_data"), E(3, 4, tp="model")]
    status, pipe = api("/api/pipelines", "POST", {"name": name, "is_draft": False, "nodes": nodes, "edges": edges})
    if status != 201:
        print(f"CREATE {status}: {pipe}")
        return 1
    status, job = api(f"/api/pipelines/{pipe['id']}/execute", "POST", {})
    if status != 200:
        print(f"EXECUTE {status}: {job}")
        return 1
    jid, iid = job["id"], job.get("vast_instance_id", "")
    print(f"Job {jid} — instance {iid or '(aucune louée !)'}")
    if not iid or iid in ("local-instance-id", "mock-instance-id", "dummy-instance-id"):
        print("ÉCHEC : aucune instance réelle louée (serveur en mock/local ? MLBLOCK_RUN_MODE=gpu ?)")
        return 1

    try:
        job_state = {}
        seen_outs = 0
        for i in range(POLL_STATUS):
            time.sleep(30)
            _, job_state = api(f"/api/jobs/{jid}")
            if i % 4 == 3:
                code, inst = vast_get(f"/instances/{iid}/")
                st = (inst.get("instances") or {}).get("actual_status") if code == 200 else None
                det = ""
                code1, detail = vast_instance_detail(iid)
                if detail:
                    det = f" v1={detail.get('actual_status')}/{detail.get('cur_state')} gpu={detail.get('gpu_util')} msg={str(detail.get('status_msg'))[:80]}"
                print(f"  vast: http={code} actual_status={st}{det}")
            _, outs = api(f"/api/jobs/{jid}/outputs")
            if isinstance(outs, list):
                for o in outs[seen_outs:]:
                    print(f"  out [{o.get('block_name')}] {o.get('output', '')[:120]}")
                seen_outs = len(outs)
            else:
                print(f"  outputs inattendus: {str(outs)[:120]}")
            print(f"[{i + 1:02d}] status={job_state.get('status')} outs={len(outs)}")
            if job_state.get("status") in ("done", "error", "cancelled"):
                break
        else:
            print("TIMEOUT : aucun callback final. Piste n°1 : BACKEND_URL injoignable depuis Vast "
                  "(localhost ? tunnel tombé ?). L'instance tourne peut-être encore — destroy de secours.")
            return 1

        _, outs = api(f"/api/jobs/{jid}/outputs")
        blocks = [o.get("block_name") for o in outs]
        texts = [o.get("output", "") for o in outs]
        fetched = any("Code récupéré" in t for t in texts)
        print(f"Sorties : {len(outs)} blocs={blocks}")
        print(f"Code importé au boot : {'OUI' if fetched else 'NON'}")
        if job_state.get("status") != "done":
            print(f"ÉCHEC job={job_state.get('status')} error={str(job_state.get('error'))[:300]}")
            return 1
        if not fetched:
            print("ÉCHEC : job done mais sans preuve de fetch (théorie bootstrap invalide)")
            return 1

        for i in range(POLL_DESTROY):
            time.sleep(10)
            code, inst = vast_get(f"/instances/{iid}/")
            st = (inst.get("instances") or {}).get("actual_status") if code == 200 else None
            print(f"[destroy {i + 1:02d}] http={code} actual_status={st}")
            if code == 404 or st in ("exited", None):
                break
        else:
            print("DOUTE : instance encore visible après 2 min (facturation ?). Destroy de secours.")
            return 1
        print("SUCCÈS : rent → boot → fetch → run → callbacks → done → destroy")
        return 0
    finally:
        code = vast_delete_instance(iid)
        print(f"Destroy de secours : http={code} (200/404 = rien qui tourne)")
        if KEEP:
            print(f"--keep : pipeline {pipe['id']} et job {jid} conservés pour analyse")
        else:
            try:
                api(f"/api/pipelines/{pipe['id']}", "DELETE")
            except Exception:
                pass


if __name__ == "__main__":
    raise SystemExit(main())
