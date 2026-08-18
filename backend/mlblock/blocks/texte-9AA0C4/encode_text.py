import numpy as np


def encode_text(in_1: "list[str]", vocab: "dict", max_len: "int" = 32) -> "numpy.ndarray":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Encoder des tokens en indices.
    Convertit une liste de tokens en indices de vocabulaire (padding).

    Args:
        in_1: Liste de tokens.
        vocab: Vocabulaire (dict token → index).
        max_len: Longueur maximale (entre: 4-64, pas: 1).
    """
    indices = [vocab.get(t, 0) for t in in_1[:max_len]]
    indices += [0] * (max_len - len(indices))
    return np.array(indices, dtype=np.int64)
