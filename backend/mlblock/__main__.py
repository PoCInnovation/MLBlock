import argparse
import json
from pathlib import Path

import torch

from mlblock.validation import validate as validate_pipeline


def main():
    parser = argparse.ArgumentParser(description="MLBlock - Pipeline builder")
    parser.add_argument("config", nargs="?", default="configs/cnn_mnist.json",
                        help="Path to pipeline JSON config")
    parser.add_argument("--mode", choices=["generate", "build"], default="generate",
                        help="generate: produit du code Python, build: construit et exécute le modèle")
    args = parser.parse_args()

    raw = json.loads(Path(args.config).read_text())
    graph_data = raw.get("graph", raw)
    nodes = graph_data.get("nodes", [])
    edges = graph_data.get("edges", [])

    vr = validate_pipeline(nodes, edges)
    if not vr.valid:
        raise SystemExit(f"Validation failed: {'; '.join(vr.errors)}")

    if args.mode == "build":
        # Build without Graph — via deep Validation order + BlockRegistry
        from mlblock.core.block import BlockRegistry

        nodes_by_id = {n["id"]: n for n in nodes}
        order = vr.order
        # Find input node (first with no incoming)
        incoming = {e["target"] for e in edges}
        input_node = None
        for nid in order:
            if nid not in incoming:
                input_node = nodes_by_id.get(nid)
                break
        if input_node is None and nodes:
            input_node = nodes[0]
        # Execute in topo order (same as Pipeline.run, no Graph)
        outputs: dict = {}
        params_by_id = {n["id"]: dict(n.get("params", {})) for n in nodes}
        # Dummy injection for root buildable nodes (same as /build)
        for nid in order:
            if nid not in incoming:
                n = nodes_by_id[nid]
                leg = BlockRegistry.get(n["type"])
                if leg and leg.can_build():
                    leg.coerce_params(params_by_id[nid])
                    first_name = leg.inputs[0].get("name", "in_1") if leg.inputs else None
                    first_param = leg.params.get(first_name, {}) if first_name else {}
                    if leg.inputs and first_param.get("required", True):
                        from mlblock.core.types import family_of

                        first_in = leg.inputs[0].get("dtype", "")
                        if family_of(first_in) == "image":
                            params_by_id[nid]["in_1"] = torch.randn(3, 224, 224)
                        else:
                            shape = params_by_id[nid].get("shape", params_by_id[nid].get("in_channels", [1, 1, 28, 28]))
                            if isinstance(shape, int):
                                shape = [1, shape, 28, 28]
                            elif isinstance(shape, list):
                                shape = [1] + shape if len(shape) < 4 else shape
                            params_by_id[nid]["in_1"] = torch.randn(*shape)
        for nid in order:
            n = nodes_by_id[nid]
            leg = BlockRegistry.get(n["type"])
            if leg is None:
                continue
            inputs: dict = {}
            for e in edges:
                if e["target"] == nid:
                    src_val = outputs.get(e["source"])
                    if isinstance(src_val, dict) and e["source_port"] in src_val:
                        inputs[e["target_port"]] = src_val[e["source_port"]]
                    else:
                        inputs[e["target_port"]] = src_val
            call_params = dict(params_by_id[nid])
            if inputs:
                call_params["_inputs"] = inputs
            try:
                res = leg.execute(call_params)
                if res is not None:
                    outputs[nid] = res
            except NotImplementedError:
                pass
        import torch.nn as nn

        layers = []
        for nid in order:
            leg = BlockRegistry.get(nodes_by_id[nid]["type"])
            if leg and leg.can_build():
                try:
                    r = outputs.get(nid)
                    if isinstance(r, dict):
                        for v in r.values():
                            if isinstance(v, nn.Module):
                                layers.append(v)
                    elif isinstance(r, nn.Module):
                        layers.append(r)
                except Exception:
                    pass
        model = nn.Sequential(*layers) if layers else (list(outputs.values())[-1] if outputs else None)
        if model is None:
            print("Aucun layer construit — Pipeline vide")
            return
        shape = (input_node.get("params", {}) if input_node else {}).get("shape", [1, 28, 28])
        dummy = torch.randn(1, *shape)
        output = model(dummy)
        print(f"Modèle construit avec succès : {model}")
        print(f"Entrée : shape {tuple(dummy.shape)}")
        print(f"Sortie : shape {tuple(output.shape)}")
        print(f"Valeurs : {output}")
    else:
        from mlblock.core.generator import generate_code
        from mlblock.server.schemas import PipelineNode, PipelineEdge

        pn = [PipelineNode(**n) for n in nodes]
        pe = [PipelineEdge(**e) for e in edges]
        print(generate_code(pn, pe))


if __name__ == "__main__":
    main()
