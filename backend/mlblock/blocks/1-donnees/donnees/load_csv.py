import pandas as pd


def load_csv(path: "file") -> "pd.DataFrame":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Load CSV.
    Charge un fichier CSV en DataFrame.

    Args:
        path: URL du fichier CSV. (format: .csv)
    """
    import pandas as pd

    try:
        return pd.read_csv(path)
    except Exception as e:
        raise ValueError(f"Fichier illisible ({e}) — vérifie qu'il existe ou réimporte-le") from e
