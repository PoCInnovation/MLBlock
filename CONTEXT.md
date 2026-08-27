# MLBlock

No-code builder where learners assemble AI pipelines as graphs of executable blocks.

## Language

**Block**:
A reusable executable unit defined by a Python function (e.g., `conv2d`, `load_csv`); file stem is its key, annotated ports `in_1: "torch.Tensor"` / outputs `out_1`, French docstring label + summary.
_Avoid_: Bloc, Node (definition vs placed instance), Component, Service

**Catalog**:
The deep module that discovers, parses, and indexes all Blocks by Category (`{category}-{HEXCOLOR}/` dirs), owning color, docstring suffix metadata, type/dtype parsing, and source text — single source of truth behind one seam.
_Avoid_: Registry, BlockRegistry, BLOCK_REGISTRY (legacy names)

**Pipeline**:
An ordered DAG of placed Blocks (nodes) and typed edges, validated then run or code-generated. Sequentially corresponds to a what the learner saves as a project.
_Avoid_: Graph (internal), DAG, Workflow

**Job**:
An execution of a Pipeline, local subprocess or Vast.ai dispatch, tracked via `status/output/error` callbacks and persisted per-block outputs.
_Avoid_: Run, Execution, Task
