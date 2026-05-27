import importlib
from pathlib import Path

from mlblock.models.block_spec import BlockSpec
from mlblock.core.block import BlockRegistry

BLOCK_REGISTRY: dict[str, BlockSpec] = {}


def _discover():
    pkg_dir = Path(__file__).parent
    for py_file in sorted(pkg_dir.rglob("*.py")):
        if py_file.name in ("__init__.py", "registry.py"):
            continue
        rel = py_file.relative_to(pkg_dir.parent)
        module_name = "mlblock." + ".".join(rel.with_suffix("").parts)
        try:
            module = importlib.import_module(module_name)
            if hasattr(module, "BLOCK"):
                key = py_file.stem
                BLOCK_REGISTRY[key] = module.BLOCK
                BlockRegistry.register(key, module.BLOCK)
        except ImportError:
            pass


_discover()
