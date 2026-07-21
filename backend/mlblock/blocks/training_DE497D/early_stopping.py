_early_stopping_best = float("inf")
_early_stopping_counter = 0


def early_stopping(in_1: "float", patience: "int" = 10) -> "bool":
    """Early stopping.
    
    Args:
        in_1: Current loss value.
        patience: Number of epochs to wait for improvement.
    """
    global _early_stopping_best, _early_stopping_counter
    if in_1 < _early_stopping_best:
        _early_stopping_best = in_1
        _early_stopping_counter = 0
        return False
    _early_stopping_counter += 1
    return _early_stopping_counter >= patience
