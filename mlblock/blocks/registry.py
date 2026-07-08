import importlib
import re
from collections.abc import Callable
from pathlib import Path
from typing import Any

from mlblock.core.block import BlockRegistry

BLOCK_REGISTRY: dict[str, dict[str, Any]] = {}
CATEGORY_COLORS: dict[str, str] = {}


def _color_from_folder(name: str) -> str | None:
    """Extract hex color from folder name like 'neural_6366F1'."""
    m = re.match(r"^.*_([0-9A-Fa-f]{6})$", name)
    return f"#{m.group(1).upper()}" if m else None


def _discover():
    pkg_dir = Path(__file__).parent
    for py_file in sorted(pkg_dir.rglob("*.py")):
        if py_file.name in ("__init__.py", "registry.py"):
            continue
        folder = py_file.parent.name
        category = folder.split("_")[0] if "_" in folder else folder
        rel = py_file.relative_to(pkg_dir.parent)
        module_name = "mlblock." + ".".join(rel.with_suffix("").parts)
        try:
            module = importlib.import_module(module_name)
            if hasattr(module, "BLOCK"):
                key = py_file.stem
                module.BLOCK["category"] = category
                BLOCK_REGISTRY[key] = module.BLOCK
                build_fn: Callable[[dict[str, Any]], Any] | None = None
                if hasattr(module, "BUILD"):
                    build_fn = module.BUILD
                BlockRegistry.register(key, module.BLOCK, build_fn)
                color = _color_from_folder(folder)
                if color and category not in CATEGORY_COLORS:
                    CATEGORY_COLORS[category] = color
        except ImportError:
            pass


_discover()
