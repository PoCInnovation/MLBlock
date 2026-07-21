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
    name = _name(ret)
    return [{"name": "out_1", "dtype": name}]


def _inspect_function(name: str, fn: Callable, category: Any) -> Any:
    from mlblock.server.schemas import Block, ParamInfo
    sig = inspect.signature(fn)
    try:
        type_hints = typing.get_type_hints(fn)
    except Exception:
        type_hints = {}
    params = {}
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
        pdesc = _extract_param_desc(fn.__doc__, pname) or ""
        pdefault = None if p.default == inspect.Parameter.empty else p.default
        prequired = p.default == inspect.Parameter.empty
        params[pname] = ParamInfo(type=ptype, description=pdesc, default=pdefault, required=prequired, options=options)
    outputs = _parse_return_annotation(sig.return_annotation)
    return Block(
        name=name,
        description=fn.__doc__ or "",
        category=category,
        params=params,
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
        cat_name = category_dir.name.rsplit("_", 1)[0] if "_" in category_dir.name else category_dir.name
        category = Category(name=cat_name, color=cat_color or "#888888")

        for py_file in sorted(category_dir.glob("*.py")):
            if py_file.name.startswith("_"):
                continue
            module_name = f"mlblock.blocks.{category_dir.name}.{py_file.stem}"
            try:
                module = importlib.import_module(module_name)
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
                            "params": {k: {"type": v.type, "default": v.default, "required": v.required} for k, v in block.params.items()},
                            "inputs": block.inputs,
                            "outputs": block.outputs,
                            "template": "",
                        }
                        CoreBlockRegistry.register(obj_name, legacy_spec, obj)
            except Exception as e:
                print(f"Error discovering block {module_name}: {e}")


_discover()
