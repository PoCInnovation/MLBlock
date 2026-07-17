## MODIFIED Requirements

### Requirement: Pipeline definition format

The pipeline must be defined as a DAG with named nodes and port-based edges, not a linear block list.

#### MODIFIED JSON format

**FROM** (linear model):
```json
{
  "name": "Analyse ventes",
  "blocks": [
    {"name": "load_csv", "params": {"path": "ventes.csv"}, "inputs": {}},
    {"name": "train_test_split", "params": {"target_column": "prix", "test_size": 0.2}, "inputs": {"data": "out_1"}},
    {"name": "linear_regression", "params": {}, "inputs": {"train_data": "out_2", "train_target": "out_4"}}
  ]
}
```

**TO** (graph model):
```json
{
  "name": "Analyse ventes",
  "nodes": [
    {"id": "n1", "type": "load_csv", "params": {"path": "ventes.csv"}},
    {"id": "n2", "type": "train_test_split", "params": {"target_column": "prix", "test_size": 0.2}},
    {"id": "n3", "type": "linear_regression", "params": {}}
  ],
  "edges": [
    {"source": "n1", "source_port": "out", "target": "n2", "target_port": "data"},
    {"source": "n2", "source_port": "X_train", "target": "n3", "target_port": "train_data"},
    {"source": "n2", "source_port": "y_train", "target": "n3", "target_port": "train_target"}
  ]
}
```

#### MODIFIED Connection mechanism

**FROM**: Default `out_N` (index-based), user selects from dropdown of previous block outputs.

**TO**: Named port-based connections via `edges`. Each edge references a source node ID, source port name, target node ID, and target port name. The frontend builds edges from a visual DAG editor.

#### MODIFIED Generated code

The generated code still produces readable `out_N` variable names as an implementation detail of the code generator, but the pipeline definition is graph-based.

**FROM**:
```python
out_1 = load_csv(path="ventes.csv")
out_2, out_3, out_4, out_5 = train_test_split(data=out_1, target_column="prix", test_size=0.2)
out_6 = linear_regression(train_data=out_2, train_target=out_4)
```

**TO**: Same output (code generator handles variable naming), but explain that these variable names are the generator's internal convention, not the pipeline model. Add topological sort explanation.

### Requirement: Pipeline model validation

#### MODIFIED Validation rules

**Reason**: The validation now works on graph structure, not sequential indices.

**ADDED**: Graph must be acyclic (cycle detection via topological sort).
**ADDED**: Every edge source and target must reference an existing node ID.
**ADDED**: Port names must be validated against the block's input/output spec.
