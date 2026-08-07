def tokenize(text: "str", sep: "str" = " ") -> "list[str]":
    """Découper un texte en tokens.
    Sépare un texte en mots (minuscules, sans ponctuation).

    Args:
        text: Texte à découper.
        sep: Séparateur (choix: | |,|).
    """
    import re

    return [t for t in re.split(r"[" + re.escape(sep) + r"\.,!?;:]+", text.lower()) if t]
