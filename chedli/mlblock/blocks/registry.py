import importlib
from pathlib import Path
from chedli.mlblock.models.block_spec import BlockSpec

BLOCK_REGISTRY: dict[str, BlockSpec] = {}
_KEY_SOURCE: dict[str, Path] = {}


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
                if key in BLOCK_REGISTRY:
                    raise KeyError(
                        f"Conflit: '{key}' défini dans {py_file} et {_KEY_SOURCE[key]}"
                    )
                BLOCK_REGISTRY[key] = module.BLOCK
                _KEY_SOURCE[key] = py_file
        except ImportError:
            pass


_discover()
