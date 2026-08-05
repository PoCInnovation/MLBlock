import torch


def model_checkpoint(in_1: "torch.nn.Module", filepath: "str" = "model.pth") -> "None":
    """Model checkpoint.
    
    Args:
        in_1: Model to save.
        filepath: Path to save the model.
    """
    torch.save(in_1.state_dict(), filepath)
