import importlib
import inspect
import re
import typing
from collections.abc import Callable
from pathlib import Path
from typing import Any

BLOCK_REGISTRY: dict[str, Any] = {}
BLOCK_SOURCES: dict[str, str] = {}


def _color_from_folder(name: str) -> str | None:
    """Extract hex color from folder name like 'convolution-6366F1'."""
    m = re.match(r"^.*[-_]?([0-9A-Fa-f]{6})$", name)
    return f"#{m.group(1).upper()}" if m else None


def _name(obj: Any) -> str:
    if hasattr(obj, "__name__"):
        return obj.__name__
    return str(obj)


def _extract_param_desc(doc: str | None, pname: str) -> tuple[str, dict[str, Any]]:
    """Description + structured FR suffix from a param docstring line.

    Suffixes: (entre: 0-1, pas: 0.05) (impair) (choix: a|b)
              (format: [C,H,W]) (longueur: 3)
    Unknown/malformed suffixes are ignored (never block discovery).
    """
    if not doc:
        return "", {}
    pattern = rf"(?:param\s+{pname}\s*:\s*|{pname}\s*:\s*)([^\n]+)"
    m = re.search(pattern, doc, re.IGNORECASE)
    if not m:
        return "", {}
    line = m.group(1).strip()
    meta: dict[str, Any] = {}
    while True:
        mm = re.search(r"\(([^()]*)\)\s*\.?\s*$", line)
        if not mm:
            break
        group = mm.group(1).strip()
        parsed: dict[str, Any] | None = None
        if group.startswith("entre:"):
            body = group[len("entre:"):].strip()
            m2 = re.match(r"(-?[\d.]+)\s*[—-]\s*(-?[\d.]+)(?:,\s*pas:\s*(-?[\d.]+))?", body)
            if m2:
                parsed = {"min": float(m2.group(1)), "max": float(m2.group(2))}
                if m2.group(3):
                    parsed["step"] = float(m2.group(3))
        elif group == "impair":
            parsed = {"odd": True}
        elif group.startswith("choix:"):
            choices = [c.strip() for c in group[len("choix:"):].strip().split("|")]
            if choices:
                parsed = {"choices": choices}
        elif group.startswith("suggestions:"):
            sug = [c.strip() for c in group[len("suggestions:"):].strip().split("|")]
            if sug:
                parsed = {"suggestions": sug}
        elif group.startswith("format:"):
            parsed = {"format": group[len("format:"):].strip()}
        elif group.startswith("longueur:"):
            v = group[len("longueur:"):].strip()
            if v.isdigit():
                parsed = {"len": int(v)}
        if parsed is None:
            break  # not a meta suffix — keep the rest of the line as description
        meta.update(parsed)
        line = line[: mm.start()].rstrip()
    return line, meta


def _parse_return_annotation(ret: Any) -> list[dict[str, str]]:
    if ret == inspect.Parameter.empty or ret is None:
        return [{"name": "out_1", "dtype": "Any"}]
    name = _name(ret)
    m = re.match(r"^(?:tuple|Tuple)\[(.+)\]$", name)
    if m:
        return [
            {"name": f"out_{i + 1}", "dtype": part}
            for i, part in enumerate(_split_top_level(m.group(1)))
        ]
    m = re.match(r"^dict\[(.+)\]$", name)
    if m:
        # "name: type, name: type" → ports nommés = les clés du dict retourné
        outputs = []
        for entry in _split_top_level(m.group(1)):
            key, _, dtype = entry.partition(":")
            key, dtype = key.strip(), dtype.strip()
            if key and dtype and not any(o["name"] == key for o in outputs):
                outputs.append({"name": key, "dtype": dtype})
        if outputs:
            return outputs
    return [{"name": "out_1", "dtype": name}]


def _split_top_level(s: str) -> list[str]:
    """Split on top-level commas (depth-aware): 'A, B[C, D]' → ['A', 'B[C, D]']."""
    parts: list[str] = []
    depth, cur = 0, ""
    for ch in s:
        if ch in "[(":
            depth += 1
        elif ch in "])":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur.strip())
    return parts


def _normalize_type(t: str) -> str:
    """'int | None' → 'int'; 'list[int]' → 'list'; 'Literal[...]' → 'str'."""
    t = t.strip()
    if " | " in t:
        t = t.split(" | ", 1)[0].strip()
    if t.startswith("list["):
        return "list"
    if t.startswith("Literal["):
        return "str"
    return t


def _is_data_port_type(ptype: str) -> bool:
    """Data-flow types (input/output ports) vs hyperparams."""
    p = _normalize_type(ptype)
    if p in (
        "pd.DataFrame", "Model", "object", "Tensor", "DataFrame", "Dataset", "DataLoader",
        "Module", "Optimizer", "PIL.Image.Image", "Env", "Policy", "dict",
    ):
        return True
    return p.startswith(("torch.", "numpy.", "tuple["))


def _inspect_function(name: str, fn: Callable, category: Any) -> Any:
    from mlblock.server.schemas import Block, ParamInfo
    sig = inspect.signature(fn)
    try:
        type_hints = typing.get_type_hints(fn)
    except Exception:
        type_hints = {}
    params = {}
    inputs = []
    for pname, p in sig.parameters.items():
        hint = type_hints.get(pname)
        options = None
        ptype = "Any"
        if typing.get_origin(hint) is typing.Literal:
            options = [str(v) for v in typing.get_args(hint)]
            base = getattr(hint, "__origin__", None)
            ptype = _name(base) if base else "str"
        elif hint and hint != inspect.Parameter.empty:
            ptype = _name(hint)
        elif p.annotation != inspect.Parameter.empty:
            ann = p.annotation
            if typing.get_origin(ann) is typing.Literal:
                options = [str(v) for v in typing.get_args(ann)]
                ptype = "str"
            else:
                ann_str = _name(ann)
                m = re.match(r"Literal\[(.+)\]", ann_str)
                if m:
                    options = [v.strip().strip("'\"") for v in m.group(1).split(",")]
                    ptype = "str"
                else:
                    ptype = ann_str
        # Port dtype comes from the raw annotation string (get_type_hints
        # strips module prefixes: torch.Tensor → Tensor)
        port_dtype = p.annotation if isinstance(p.annotation, str) else ptype
        # Data ports: in_<N> prefix or data-flow type (hyperparams stay params)
        if re.match(r"^in_\d+$", pname) or _is_data_port_type(port_dtype):
            inputs.append({"name": pname, "dtype": port_dtype})
        pdesc, pmeta = _extract_param_desc(fn.__doc__, pname)
        pdefault = None if p.default == inspect.Parameter.empty else p.default
        prequired = p.default == inspect.Parameter.empty
        params[pname] = ParamInfo(
            type=ptype, description=pdesc, default=pdefault,
            required=prequired, options=options, **pmeta,
        )
    outputs = _parse_return_annotation(sig.return_annotation)
    return Block(
        name=name,
        description=fn.__doc__ or "",
        category=category,
        params=params,
        inputs=inputs,
        outputs=outputs,
    )


def _discover():
    from mlblock.server.schemas import Category
    from mlblock.core.block import BlockRegistry as CoreBlockRegistry

    blocks_dir = Path(__file__).parent
    for category_dir in sorted(blocks_dir.iterdir()):
        if not category_dir.is_dir() or category_dir.name.startswith("_"):
            continue
        cat_color = _color_from_folder(category_dir.name)
        cat_name = re.sub(r"[-_][0-9A-Fa-f]{6}$", "", category_dir.name)
        category = Category(name=cat_name, color=cat_color or "#888888")

        for py_file in sorted(category_dir.glob("*.py")):
            if py_file.name.startswith("_"):
                continue
            module_name = f"mlblock.blocks.{category_dir.name}.{py_file.stem}"
            try:
                # spec_from_file_location : les dossiers français ont des tirets
                # (invalides pour importlib.import_module)
                spec = importlib.util.spec_from_file_location(module_name, py_file)
                if spec is None or spec.loader is None:
                    continue
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                for obj_name in dir(module):
                    obj = getattr(module, obj_name)
                    if callable(obj) and not obj_name.startswith("_") and obj.__module__ == module_name:
                        block = _inspect_function(obj_name, obj, category)
                        BLOCK_REGISTRY[obj_name] = block
                        BLOCK_SOURCES[obj_name] = py_file.read_text(encoding="utf-8")

                        # Bridge to v1 CoreBlockRegistry for core/graph.py compatibility
                        legacy_spec = {
                            "label": obj_name.replace("_", " ").title(),
                            "category": cat_name,
                            "params": {
                                k: {"type": v.type, "default": v.default, "required": v.required}
                                for k, v in block.params.items()
                            },
                            "inputs": block.inputs,
                            "outputs": block.outputs,
                            "template": "",
                        }
                        CoreBlockRegistry.register(obj_name, legacy_spec, obj)
            except Exception as e:
                print(f"Error discovering block {module_name}: {e}")


_discover()
