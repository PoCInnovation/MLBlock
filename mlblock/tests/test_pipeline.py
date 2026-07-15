from mlblock.core.graph import Graph
from mlblock.core.pipeline import Pipeline


MNIST_CONFIG = {
    "graph": {
        "nodes": [
            {
                "id": "input_1", "type": "input",
                "params": {"shape": [1, 28, 28]},
            },
            {
                "id": "conv1", "type": "conv2d",
                "params": {"in_channels": 1, "out_channels": 32, "kernel_size": 3},
            },
            {
                "id": "relu1", "type": "relu",
                "params": {},
            },
            {
                "id": "pool1", "type": "maxpool2d",
                "params": {"kernel_size": 2},
            },
            {
                "id": "flat", "type": "flatten",
                "params": {},
            },
            {
                "id": "fc1", "type": "linear",
                "params": {"in_features": 5408, "out_features": 128},
            },
            {
                "id": "relu2", "type": "relu",
                "params": {},
            },
            {
                "id": "fc2", "type": "linear",
                "params": {"in_features": 128, "out_features": 10},
            },
            {
                "id": "output", "type": "softmax",
                "params": {"dim": 1},
            },
        ],
        "edges": [
            {"source": "input_1", "source_port": "out_1", "target": "conv1", "target_port": "in_1"},
            {"source": "conv1", "source_port": "out_1", "target": "relu1", "target_port": "in_1"},
            {"source": "relu1", "source_port": "out_1", "target": "pool1", "target_port": "in_1"},
            {"source": "pool1", "source_port": "out_1", "target": "flat", "target_port": "in_1"},
            {"source": "flat", "source_port": "out_1", "target": "fc1", "target_port": "in_1"},
            {"source": "fc1", "source_port": "out_1", "target": "relu2", "target_port": "in_1"},
            {"source": "relu2", "source_port": "out_1", "target": "fc2", "target_port": "in_1"},
            {"source": "fc2", "source_port": "out_1", "target": "output", "target_port": "in_1"},
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
    assert "out_conv1" in code
    assert "out_relu1" in code
    assert "out_fc1" in code
    assert "out_output" in code

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
        ("conv2d", {"in_channels": 3, "out_channels": 16}),
        ("maxpool2d", {"kernel_size": 2}),
        ("avgpool2d", {"kernel_size": 2}),
        ("relu", {}),
        ("sigmoid", {}),
        ("tanh", {}),
        ("flatten", {}),
        ("linear", {"in_features": 100, "out_features": 10}),
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
        assert "out_layer" in code

def test_generated_code_has_main_block():
    graph_data = MNIST_CONFIG["graph"]
    graph = Graph(graph_data)
    pipeline = Pipeline(graph)
    code = pipeline.generate_code()
    assert '__name__ == "__main__"' in code
