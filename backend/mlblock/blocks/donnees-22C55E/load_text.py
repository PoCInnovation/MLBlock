import pandas as pd


def load_text(path: "file", text_column: "str" = "texte", label_column: "str" = "") -> "pd.DataFrame":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Charger un jeu de textes.
    Charge un CSV de textes (phrases) en DataFrame, avec une colonne de label
    optionnelle — branchable sur tokenisation ou classification.

    Args:
        path: Parameter.
        text_column: Colonne contenant les textes.
        label_column: Colonne de label (vide = aucun).
    """
    import pandas as pd
    df = pd.read_csv(path)
    cols = [c for c in [text_column, label_column] if c]
    return df[cols] if cols else df
