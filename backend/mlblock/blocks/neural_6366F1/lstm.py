import torch
from torch import nn


def lstm(in_1: "torch.Tensor", input_size: "int", hidden_size: "int", num_layers: "int" = 1, bias: "bool" = True, batch_first: "bool" = True, dropout: "float" = 0.0, bidirectional: "bool" = False) -> "torch.Tensor":
    """LSTM.
    
    Args:
        in_1: Input tensor.
        input_size: Parameter.
        hidden_size: Parameter.
        num_layers: Parameter.
        bias: Parameter.
        batch_first: Parameter.
        dropout: Parameter.
        bidirectional: Parameter.
    """
    return nn.Lstm(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, bias=bias, batch_first=batch_first, dropout=dropout, bidirectional=bidirectional)(in_1)
