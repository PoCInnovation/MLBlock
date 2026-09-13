from mlblock.core.graph import Graph
from mlblock.core.pipeline import Pipeline


MNIST_CONFIG = {
    "graph": {
        "nodes": [
            {
                "id": "conv1", "type": "conv2d_layer",
                "params": {"in_channels": 1, "out_channels": 32, "kernel_size": 3},
            },
            {
                "id": "relu1", "type": "relu_layer",
                "params": {},
            },
            {
                "id": "pool1", "type": "maxpool2d_layer",
                "params": {"kernel_size": 2},
            },
            {
                "id": "flat", "type": "flatten_layer",
                "params": {},
            },
            {
                "id": "fc1", "type": "linear_layer",
                "params": {"in_features": 5408, "out_features": 128},
            },
            {
                "id": "relu2", "type": "relu_layer",
                "params": {},
            },
            {
                "id": "fc2", "type": "linear_layer",
                "params": {"in_features": 128, "out_features": 10},
            },
        ],
        "edges": [
            {"source": "conv1", "source_port": "out_1", "target": "relu1", "target_port": "in_1"},
            {"source": "relu1", "source_port": "out_1", "target": "pool1", "target_port": "in_1"},
            {"source": "pool1", "source_port": "out_1", "target": "flat", "target_port": "in_1"},
            {"source": "flat", "source_port": "out_1", "target": "fc1", "target_port": "in_1"},
            {"source": "fc1", "source_port": "out_1", "target": "relu2", "target_port": "in_1"},
            {"source": "relu2", "source_port": "out_1", "target": "fc2", "target_port": "in_1"},
        ],
    }
}


def test_generate_code_returns_string():
    graph_data = MNIST_CONFIG["graph"]
    graph = Graph(graph_data)
    pipeline = Pipeline(graph)
    code = pipeline.generate_code()
    assert isinstance(code, str)
    assert len(code) > 0


def test_generated_code_contains_layers():
    graph_data = MNIST_CONFIG["graph"]
    graph = Graph(graph_data)
    pipeline = Pipeline(graph)
    code = pipeline.generate_code()
    assert "conv2d_layer" in code
    assert "flatten_layer" in code
    assert "linear_layer" in code

def test_generated_code_contains_params():
    graph_data = MNIST_CONFIG["graph"]
    graph = Graph(graph_data)
    pipeline = Pipeline(graph)
    code = pipeline.generate_code()
    assert "kernel_size=3" in code
    assert "in_features=5408" in code or "5408" in code
    assert "out_features=128" in code or "128" in code

def test_all_block_templates_generate_code():
    block_types = [
        ("conv2d_layer", {"in_channels": 3, "out_channels": 16}),
        ("maxpool2d_layer", {"kernel_size": 2}),
        ("avgpool2d", {"kernel_size": 2}),
        ("relu_layer", {}),
        ("sigmoid", {}),
        ("tanh", {}),
        ("flatten_layer", {}),
        ("linear_layer", {"in_features": 100, "out_features": 10}),
        ("dropout", {"p": 0.5}),
        ("batchnorm2d", {"num_features": 16}),
        ("softmax", {"dim": 1}),
    ]
    for type_name, params in block_types:
        graph_data = {
            "nodes": [
                {"id": "inp", "type": "input", "params": {"shape": [1]}},
                {"id": "layer", "type": type_name, "params": params},
            ],
            "edges": [
                {"source": "inp", "source_port": "out_1",
                 "target": "layer", "target_port": "in_1"},
            ],
        }
        graph = Graph(graph_data)
        pipeline = Pipeline(graph)
        code = pipeline.generate_code()
        assert isinstance(code, str)
        assert len(code) > 0
        assert "out_2 = " + type_name in code

def test_generated_code_has_main_block():
    graph_data = MNIST_CONFIG["graph"]
    graph = Graph(graph_data)
    pipeline = Pipeline(graph)
    code = pipeline.generate_code()
    assert '__name__ == "__main__"' in code
