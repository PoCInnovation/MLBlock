def build_vocab(in_1: "list[str]") -> "dict":
    """Construire un vocabulaire.
    Indexe chaque token unique (0 = inconnu, 1..n = tokens).

    Args:
        in_1: Liste de tokens.
    """
    unique = sorted(set(in_1))
    return {t: i + 1 for i, t in enumerate(unique)}
