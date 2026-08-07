_early_stopping_best = float("inf")
_early_stopping_counter = 0


def early_stopping(in_1: "float", patience: "int" = 10) -> "bool":
    """Arrêt précoce.
    Arrête l'entraînement si la perte ne s'améliore plus.
    
    Args:
        in_1: Current loss value.
        patience: Patience. (entre: 1-100)
    """
    global _early_stopping_best, _early_stopping_counter
    if in_1 < _early_stopping_best:
        _early_stopping_best = in_1
        _early_stopping_counter = 0
        return False
    _early_stopping_counter += 1
    return _early_stopping_counter >= patience
