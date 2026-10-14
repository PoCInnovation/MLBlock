"""Report (never fails): share of essential blocks with a minimal example.

Essential = visible in the beginner palette (advanced=False). A block
counts as documented when its docstring contains an "Exemple:" section.
Target 100% long term; this script only reports.
"""
from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from mlblock.catalog import catalog  # noqa: E402


def main() -> None:
    blocks = catalog.all()
    essential = {
        name: b
        for name, b in blocks.items()
        if not getattr(b, "advanced", False)
    }
    with_example = sorted(
        name
        for name, b in essential.items()
        if "exemple:" in (b.description or "").lower()
    )
    missing = sorted(set(essential) - set(with_example))
    pct = 100.0 * len(with_example) / max(len(essential), 1)
    print(f"Essential blocks: {len(essential)}")
    print(f"With minimal example: {len(with_example)} ({pct:.0f}%)")
    if missing:
        print(f"Missing example ({len(missing)}):")
        for name in missing[:30]:
            print(f"  - {name}")
        if len(missing) > 30:
            print(f"  ... and {len(missing) - 30} more")


if __name__ == "__main__":
    main()
