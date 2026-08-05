def to_tensor(in_1: "numpy.ndarray") -> "torch.Tensor":
    """Convert to tensor.

    Args:
        in_1: Input image (numpy array).
    """
    from torchvision import transforms
    return transforms.ToTensor()(in_1)
