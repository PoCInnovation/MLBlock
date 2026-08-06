import torch
from torch import nn


def gru(in_1: "torch.Tensor", input_size: "int", hidden_size: "int", num_layers: "int" = 1, bias: "bool" = True, batch_first: "bool" = True, dropout: "float" = 0.0, bidirectional: "bool" = False) -> "torch.Tensor":
    """GRU.
    
    Args:
        in_1: Input tensor.
        input_size: Parameter. (suggestions: 16|32|64|128)
        hidden_size: Parameter. (suggestions: 32|64|128|256)
        num_layers: Parameter.
        bias: Parameter.
        batch_first: Parameter.
        dropout: Probabilité de dropout. (entre: 0-1) (suggestions: 0.1|0.25|0.5)
        bidirectional: Parameter.
    """
    return nn.Gru(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, bias=bias, batch_first=batch_first, dropout=dropout, bidirectional=bidirectional)(in_1)
