import pandas as pd


def load_csv(path: "file") -> "pd.DataFrame":
    """Charger un CSV.
    Charge un fichier CSV en DataFrame.
    
    Args:
        path: Parameter.
    """
    import pandas as pd
    return pd.read_csv(path)
