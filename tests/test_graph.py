import pytest

from mlblock.core.graph import Graph, GraphNode, Edge


SIMPLE_GRAPH = {
    "nodes": [
        {
            "id": "input_1",
            "type": "input",
            "params": {"shape": [1, 28, 28]},
            "ports": {"out": [{"name": "out", "dtype": "Tensor"}]},
        },
        {
            "id": "conv1",
            "type": "conv2d",
            "params": {"in_channels": 1, "out_channels": 32},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        },
        {
            "id": "relu1",
            "type": "relu",
            "params": {},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        },
    ],
    "edges": [
        {"source": "input_1", "source_port": "out", "target": "conv1", "target_port": "in"},
        {"source": "conv1", "source_port": "out", "target": "relu1", "target_port": "in"},
    ],
}


def test_graph_construct():
    graph = Graph(SIMPLE_GRAPH)
    assert len(graph.nodes) == 3
    assert len(graph.edges) == 2


def test_graph_node_creation():
    graph = Graph(SIMPLE_GRAPH)
    node = graph.nodes["conv1"]
    assert node.id == "conv1"
    assert node.type == "conv2d"
    assert node.params == {"in_channels": 1, "out_channels": 32}
    assert node.block is not None
    assert node.block.name == "conv2d"


def test_graph_edge_creation():
    graph = Graph(SIMPLE_GRAPH)
    edge = graph.edges[0]
    assert edge.source == "input_1"
    assert edge.target == "conv1"
    assert edge.source_port == "out"
    assert edge.target_port == "in"


def test_edge_repr():
    graph = Graph(SIMPLE_GRAPH)
    edge = graph.edges[0]
    assert str(edge) == "Edge(input_1.out -> conv1.in)"


def test_graph_node_repr():
    node = GraphNode(
        {
            "id": "test",
            "type": "relu",
            "params": {},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        }
    )
    assert str(node) == "GraphNode(test: relu)"


def test_topological_sort():
    graph = Graph(SIMPLE_GRAPH)
    order = graph.topological_sort()
    assert order == ["input_1", "conv1", "relu1"]
    # Check order respects dependencies
    assert order.index("input_1") < order.index("conv1")
    assert order.index("conv1") < order.index("relu1")


def test_validate_valid():
    graph = Graph(SIMPLE_GRAPH)
    graph.validate()


def test_validate_unknown_source():
    bad_graph = {
        "nodes": [
            {"id": "a", "type": "relu", "params": {},
             "ports": {"in": [{"name": "in", "dtype": "Tensor"}],
                       "out": [{"name": "out", "dtype": "Tensor"}]}},
        ],
        "edges": [
            {"source": "nonexistent", "source_port": "out",
             "target": "a", "target_port": "in"},
        ],
    }
    graph = Graph(bad_graph)
    with pytest.raises(ValueError, match="source.*not found"):
        graph.validate()


def test_validate_unknown_target():
    bad_graph = {
        "nodes": [
            {"id": "a", "type": "relu", "params": {},
             "ports": {"in": [{"name": "in", "dtype": "Tensor"}],
                       "out": [{"name": "out", "dtype": "Tensor"}]}},
        ],
        "edges": [
            {"source": "a", "source_port": "out",
             "target": "nonexistent", "target_port": "in"},
        ],
    }
    graph = Graph(bad_graph)
    with pytest.raises(ValueError, match="target.*not found"):
        graph.validate()


def test_cyclic_graph():
    cyclic = {
        "nodes": [
            {"id": "a", "type": "relu", "params": {},
             "ports": {"in": [{"name": "in", "dtype": "Tensor"}],
                       "out": [{"name": "out", "dtype": "Tensor"}]}},
            {"id": "b", "type": "relu", "params": {},
             "ports": {"in": [{"name": "in", "dtype": "Tensor"}],
                       "out": [{"name": "out", "dtype": "Tensor"}]}},
        ],
        "edges": [
            {"source": "a", "source_port": "out", "target": "b", "target_port": "in"},
            {"source": "b", "source_port": "out", "target": "a", "target_port": "in"},
        ],
    }
    graph = Graph(cyclic)
    with pytest.raises(ValueError, match="contains a cycle"):
        graph.topological_sort()


def test_unknown_block_type():
    with pytest.raises(ValueError, match="Unknown block type"):
        GraphNode(
            {
                "id": "bad",
                "type": "nonexistent_block_type",
                "params": {},
                "ports": {"in": [], "out": []},
            }
        )


def test_get_input_nodes():
    graph = Graph(SIMPLE_GRAPH)
    inputs = graph.get_input_nodes()
    assert len(inputs) == 1
    assert inputs[0].id == "input_1"


def test_get_output_nodes():
    graph = Graph(SIMPLE_GRAPH)
    outputs = graph.get_output_nodes()
    assert len(outputs) == 1
    assert outputs[0].id == "relu1"
