## Context

Block parameters are currently typed as plain strings (`type: "str"`) in the API response. Parameters like `activation`, `padding`, `task`, or `kernel` have a fixed set of valid values, but the discovery system (`registry.py:_inspect_function`) doesn't extract them. The frontend must guess valid values or hardcode them.

The `typing.Literal` stdlib construct provides a way to declare fixed-value parameters in Python function signatures. By detecting `Literal[...]` during discovery, we can automatically populate an `options` field in the API, enabling frontend dropdowns.

## Goals / Non-Goals

**Goals:**
- Add `options: list[str] | None` to `ParamInfo` in the API schema
- Detect `typing.Literal` in block function signatures during auto-discovery
- Rewrite ~25 block signatures to use `Literal` for choice parameters
- Keep the change backward-compatible (new optional field, no breaking API changes)

**Non-Goals:**
- Frontend dropdown rendering (separate concern)
- Changing block execution logic (inputs/outputs unchanged)
- Adding validation that rejects non-Literal values at runtime

## Decisions

**1. Use `typing.Literal` over custom decorators or metadata**

Alternatives considered:
- Custom `@choices(...)` decorator — adds non-stdlib dependency, extra syntax
- Docstring parsing (e.g., `# choices: relu, sigmoid`) — fragile, inconsistent
- `Literal` from stdlib — zero dependencies, IDE support, standard Python

Decision: `typing.Literal`. It's the Python standard for this, works with type checkers, and requires no new dependencies.

**2. Detection in `_inspect_function` via `typing.get_origin`**

```python
import typing
origin = typing.get_origin(p.annotation)
if origin is typing.Literal:
    options = list(typing.get_args(p.annotation))
```

This is the canonical way to introspect `Literal` types. No string parsing needed.

**3. `type` field shows the base type, `options` shows allowed values**

When a parameter is `Literal["relu", "sigmoid", "tanh"]`:
- `type` → `"str"` (the base type for frontend formatting)
- `options` → `["relu", "sigmoid", "tanh"]` (the allowed values)

This keeps `type` useful for input rendering while `options` drives the dropdown.

**4. Block signature rewrites are manual, not auto-generated**

Each block needs its `Literal` types verified against the actual PyTorch/sklearn API. Auto-generating from docs would be error-prone. Manual audit ensures correctness.

## Risks / Trade-offs

- **Risk**: Some blocks may have dynamic options (e.g., depends on input shape). `Literal` only covers static choices. → Mitigation: Leave those as `str` with no `options`. The frontend falls back to text input.
- **Risk**: Breaking type checkers if `Literal` values don't match actual API. → Mitigation: Verify each block's Literal against its framework's docs before committing.
- **Trade-off**: ~25 files need signature changes. This is verbose but each change is mechanical (add `Literal[...]` import, wrap type hint).
