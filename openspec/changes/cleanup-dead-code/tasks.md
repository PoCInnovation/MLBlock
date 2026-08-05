## 1. Delete dead models/ subtree

- [x] 1.1 Delete `backend/mlblock/models/registry.py`
- [x] 1.2 Delete `backend/mlblock/models/block_spec.py`
- [x] 1.3 Delete `backend/mlblock/models/__init__.py`
- [x] 1.4 Delete `backend/mlblock/models/cnn.py`
- [x] 1.5 Verify `models/pipeline.py` still imports correctly (PipelineNode, PipelineEdge)

## 2. Delete dead top-level files

- [x] 2.1 Delete `backend/mlblock/demo.py`
- [x] 2.2 Delete `backend/test_gen.py`

## 3. Delete stub block directories

- [x] 3.1 Delete `backend/mlblock/blocks/rl_8B5CF6/` (entire directory)
- [x] 3.2 Delete `backend/mlblock/blocks/environment_14B8A6/` (entire directory)
- [x] 3.3 Delete `backend/mlblock/blocks/advanced_6B7280/` (entire directory)
- [x] 3.4 Delete `backend/mlblock/blocks/visualization_EC4899/` (entire directory)

## 4. Clean dead code in routes.py

- [x] 4.1 Remove `_blocks_used_in()` function from `routes.py`
- [x] 4.2 Remove `_collect_dependencies()` function from `routes.py`

## 5. Clean dead code in schemas.py

- [x] 5.1 Remove `Block.get()` method from `schemas.py`
- [x] 5.2 Remove `Block.__getitem__()` method from `schemas.py`
- [x] 5.3 Remove `Block.deps` field from `schemas.py`
- [x] 5.4 Remove unused `Any` import if no longer needed

## 6. Clean dead alias in pipeline.py

- [x] 6.1 Remove `Pipeline.build_model()` from `core/pipeline.py`
- [x] 6.2 Update `test_server.py::test_build_model` to call `pipeline.run()` directly

## 7. Verify

- [x] 7.1 Run `uv run pytest -v` — 47/51 pass (4 pre-existing failures)
- [x] 7.2 Run `python -m mlblock --help` — CLI still works
- [x] 7.3 Grep for deleted symbols — zero hits
