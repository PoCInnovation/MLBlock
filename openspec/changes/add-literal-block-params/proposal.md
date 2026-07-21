## Why

Block parameters like `activation`, `padding`, `task`, or `kernel` have a fixed set of valid values, but the API currently exposes them as free-text strings. The frontend has no way to know which values are valid, forcing users to guess or memorize options. Using `typing.Literal` on block function signatures lets the discovery system automatically extract the allowed values and expose them as `options` in the API, enabling the frontend to render dropdowns/selects instead of text inputs.

## What Changes

- Add `options: list[str] | None = None` field to `ParamInfo` in `schemas.py`
- Update `registry.py` `_inspect_function()` to detect `typing.Literal` type hints and populate `options`
- Rewrite block function signatures to use `Literal[...]` for parameters with fixed choices (activation functions, padding modes, pooling types, task types, optimizers, etc.)
- Audit all 59 blocks to identify parameters that should be `Literal` instead of `str`

## Capabilities

### New Capabilities
- `literal-param-discovery`: Automatic extraction of `typing.Literal` options into `ParamInfo.options` during block auto-discovery

### Modified Capabilities

(none — no existing specs)

## Impact

- **API**: `GET /api/blocks` response adds `options` field to each `ParamInfo` — non-breaking (new optional field)
- **Code**: `schemas.py`, `registry.py`, and ~25 block files need signature updates
- **Frontend**: Can render `<select>` dropdowns when `options` is present on a parameter
- **Dependencies**: None added — `typing` is stdlib
