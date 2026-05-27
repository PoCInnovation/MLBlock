import torch
import torch.nn as nn

from mlblock.core.graph import Graph
from mlblock.core.pipeline import Pipeline


MNIST_GRAPH = {
    "nodes": [
        {
            "id": "input_1", "type": "input",
            "params": {"shape": [1, 28, 28]},
            "ports": {"out": [{"name": "out", "dtype": "Tensor"}]},
        },
        {
            "id": "conv1", "type": "conv2d",
            "params": {"in_channels": 1, "out_channels": 32, "kernel_size": 3},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        },
        {
            "id": "relu1", "type": "relu",
            "params": {},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        },
        {
            "id": "pool1", "type": "maxpool2d",
            "params": {"kernel_size": 2},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        },
        {
            "id": "flat", "type": "flatten",
            "params": {},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        },
        {
            "id": "fc1", "type": "linear",
            "params": {"in_features": 5408, "out_features": 128},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        },
        {
            "id": "relu2", "type": "relu",
            "params": {},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        },
        {
            "id": "fc2", "type": "linear",
            "params": {"in_features": 128, "out_features": 10},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        },
        {
            "id": "output", "type": "softmax",
            "params": {"dim": 1},
            "ports": {
                "in": [{"name": "in", "dtype": "Tensor"}],
                "out": [{"name": "out", "dtype": "Tensor"}],
            },
        },
    ],
    "edges": [
        {"source": "input_1", "source_port": "out", "target": "conv1", "target_port": "in"},
        {"source": "conv1", "source_port": "out", "target": "relu1", "target_port": "in"},
        {"source": "relu1", "source_port": "out", "target": "pool1", "target_port": "in"},
        {"source": "pool1", "source_port": "out", "target": "flat", "target_port": "in"},
        {"source": "flat", "source_port": "out", "target": "fc1", "target_port": "in"},
        {"source": "fc1", "source_port": "out", "target": "relu2", "target_port": "in"},
        {"source": "relu2", "source_port": "out", "target": "fc2", "target_port": "in"},
        {"source": "fc2", "source_port": "out", "target": "output", "target_port": "in"},
    ],
}


def test_pipeline_build_model():
    graph = Graph(MNIST_GRAPH)
    pipeline = Pipeline(graph)
    model = pipeline.build_model()
    assert isinstance(model, nn.Sequential)
    assert len(model) == 8


def test_model_forward_pass():
    graph = Graph(MNIST_GRAPH)
    pipeline = Pipeline(graph)
    model = pipeline.build_model()

    x = torch.randn(2, 1, 28, 28)
    y = model(x)
    assert y.shape == (2, 10)


def test_model_output_is_probability():
    graph = Graph(MNIST_GRAPH)
    pipeline = Pipeline(graph)
    model = pipeline.build_model()

    x = torch.randn(1, 1, 28, 28)
    y = model(x)
    # Softmax output should sum to ~1 for each sample
    assert torch.allclose(y.sum(dim=1), torch.ones(1), atol=1e-5)


def test_pipeline_skips_input_node():
    graph = Graph(MNIST_GRAPH)
    pipeline = Pipeline(graph)
    model = pipeline.build_model()
    # input_1 should not be in the sequential (it has no builder)
    assert len(model) == 8  # conv1, relu1, pool1, flat, fc1, relu2, fc2, output


def test_all_cnn_block_types():
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
                {"id": "inp", "type": "input", "params": {"shape": [1]},
                 "ports": {"out": [{"name": "out", "dtype": "Tensor"}]}},
                {"id": "layer", "type": type_name, "params": params,
                 "ports": {"in": [{"name": "in", "dtype": "Tensor"}],
                           "out": [{"name": "out", "dtype": "Tensor"}]}},
            ],
            "edges": [
                {"source": "inp", "source_port": "out",
                 "target": "layer", "target_port": "in"},
            ],
        }
        graph = Graph(graph_data)
        pipeline = Pipeline(graph)
        model = pipeline.build_model()
        assert isinstance(model, nn.Sequential)
        assert len(model) == 1
