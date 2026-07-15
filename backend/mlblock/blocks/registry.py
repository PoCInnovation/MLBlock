import importlib
import inspect
import re
from collections.abc import Callable
from pathlib import Path
from typing import Any

BLOCK_REGISTRY: dict[str, Any] = {}
BLOCK_SOURCES: dict[str, str] = {}


def _color_from_folder(name: str) -> str | None:
    """Extract hex color from folder name like 'neural_6366F1'."""
    m = re.match(r"^.*_([0-9A-Fa-f]{6})$", name)
    return f"#{m.group(1).upper()}" if m else None


def _name(obj: Any) -> str:
    if hasattr(obj, "__name__"):
        return obj.__name__
    return str(obj)


def _extract_param_desc(doc: str | None, pname: str) -> str | None:
    if not doc:
        return None
    pattern = rf"(?:param\s+{pname}\s*:\s*|{pname}\s*:\s*)([^\n]+)"
    m = re.search(pattern, doc, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return None


def _parse_return_annotation(ret: Any) -> list[dict[str, str]]:
    if ret == inspect.Parameter.empty or ret is None:
        return [{"name": "out_1", "dtype": "Any"}]

    ret_str = str(ret)
    if "Tuple" in ret_str or "tuple" in ret_str:
        ports = []
        types = re.findall(r"([A-Za-z0-9_\.]+)", ret_str)
        type_names = [t for t in types if t.lower() != "tuple"]
        for idx, t in enumerate(type_names):
            ports.append({"name": f"out_{idx + 1}", "dtype": t})
        return ports if ports else [{"name": "out_1", "dtype": "Any"}]

    return [{"name": "out_1", "dtype": _name(ret)}]


def _extract_deps(fn: Callable) -> list[str]:
    deps: set[str] = set()
    module = inspect.getmodule(fn)
    if not module or not hasattr(module, "__file__") or not module.__file__:
        return []
    try:
        with open(module.__file__, "r", encoding="utf-8") as f:
            source = f.read()
    except Exception:
        return []

    IMPORT_TO_PIP = {
        "sklearn": "scikit-learn",
        "PIL": "pillow",
        "yaml": "pyyaml",
    }

    for line in source.splitlines():
        m = re.match(r"^\s*(?:from\s+(\S+)|import\s+(\S+))", line)
        if m:
            pkg = (m.group(1) or m.group(2)).split(".")[0]
            if pkg not in ("os", "sys", "math", "typing", "inspect", "importlib", "pathlib", "re"):
                pkg = IMPORT_TO_PIP.get(pkg, pkg)
                deps.add(pkg)
    return sorted(deps)


def _inspect_function(name: str, fn: Callable, category: Any) -> Any:
    from mlblock.server.schemas import Block, ParamInfo
    sig = inspect.signature(fn)
    params = {}
    for pname, p in sig.parameters.items():
        ptype = _name(p.annotation) if p.annotation != inspect.Parameter.empty else "Any"
        pdesc = _extract_param_desc(fn.__doc__, pname) or ""
        pdefault = None if p.default == inspect.Parameter.empty else p.default
        prequired = p.default == inspect.Parameter.empty
        params[pname] = ParamInfo(type=ptype, description=pdesc, default=pdefault, required=prequired)
    outputs = _parse_return_annotation(sig.return_annotation)
    return Block(
        name=name,
        description=fn.__doc__ or "",
        category=category,
        params=params,
        outputs=outputs,
        deps=_extract_deps(fn)
    )


def _discover():
    from mlblock.server.schemas import Category
    pkg_dir = Path(__file__).parent
    for py_file in sorted(pkg_dir.rglob("*.py")):
        if py_file.name in ("__init__.py", "registry.py"):
            continue
        folder = py_file.parent.name
        cat_name = folder.split("_")[0]
        color = _color_from_folder(folder) or "#6B7280"
        category = Category(name=cat_name, color=color)

        rel = py_file.resolve().relative_to(Path.cwd().resolve())
        module_name = ".".join(rel.with_suffix("").parts)
        try:
            module = importlib.import_module(module_name)
            for name, fn in vars(module).items():
                if name.startswith("_"):
                    continue
                if not callable(fn):
                    continue
                if fn.__module__ != module_name:
                    continue
                block = _inspect_function(name, fn, category)
                BLOCK_REGISTRY[name] = block
                try:
                    with open(py_file, "r", encoding="utf-8") as f:
                        BLOCK_SOURCES[name] = f.read()
                except Exception:
                    BLOCK_SOURCES[name] = inspect.getsource(fn)

                from mlblock.core.block import BlockRegistry as CoreBlockRegistry
                legacy_spec = {
                    "label": name.replace("_", " ").title(),
                    "category": cat_name,
                    "params": {k: {"type": v.type, "default": v.default, "required": v.required} for k, v in block.params.items()},
                    "inputs": [{"name": "in", "dtype": "Tensor"}],
                    "outputs": [{"name": "out", "dtype": "Tensor"}],
                    "template": "{output.out} = nn.SomeLayer({params.in_channels})",
                }
                CoreBlockRegistry.register(name, legacy_spec, fn)
        except Exception as e:
            print(f"Error discovering block {module_name}: {e}")


_discover()
