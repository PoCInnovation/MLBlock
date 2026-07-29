import pandas as pd


def load_csv(path: "file") -> "pd.DataFrame":
    """Charger un CSV.
    
    Args:
        path: Parameter.
    """
    import pandas as pd
    return pd.read_csv(path)
