import torch


def tensor_dataset(in_1: "torch.Tensor", in_2: "torch.Tensor") -> "torch.utils.data.TensorDataset":
    """Tensor dataset.
    
    Args:
        in_1: Features tensor.
        in_2: Labels tensor.
    """
    return torch.utils.data.TensorDataset(in_1, in_2)
