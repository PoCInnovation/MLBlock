"""Exécute LOCALEMENT le code généré de la démo ; un mini-serveur capte les callbacks /output (repli Étape 4)."""
import http.server, json, os, pathlib, subprocess, sys, tempfile, threading, base64, gzip
from mlblock.server.routes import generate_code
from mlblock.models.pipeline import PipelineNode, PipelineEdge

HERE = pathlib.Path(__file__).resolve().parent.parent
OUT = HERE / "data" / "local-run"; OUT.mkdir(parents=True, exist_ok=True)
got = []

class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("content-length", 0)))
        got.append((self.path, body)); self.send_response(200); self.send_header("content-length", "2"); self.end_headers(); self.wfile.write(b"{}")
    do_GET = do_POST
    def log_message(self, *a): pass

srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()

doc = json.loads((HERE / "pipelines" / "demo-poc-vins.json").read_text())
nodes = [PipelineNode(id=n["id"], type=n["type"], params=n["params"]) for n in doc["nodes"]]
edges = [PipelineEdge(**e) for e in doc["edges"]]
f = pathlib.Path(tempfile.mkdtemp()) / "main.py"; f.write_text(generate_code(nodes, edges))
env = {**os.environ, "BACKEND_URL": f"http://127.0.0.1:{srv.server_port}", "JOB_ID": "local-demo", "GPU_API_KEY": "x", "BACKEND_TIMEOUT": "5"}
p = subprocess.run([sys.executable, str(f)], capture_output=True, text=True, timeout=240, env=env)
print("rc =", p.returncode, "| stderr:", p.stderr[-400:])
res = []
for path, body in got:
    if path.endswith("/output"):
        try: res.append(json.loads(body))
        except Exception: pass
    elif path.endswith("/artifact"):
        (OUT / "tsne.bin").write_bytes(body); print("artifact bytes:", len(body))
(OUT / "outputs.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
for r in res: print(json.dumps(r, ensure_ascii=False)[:240])
