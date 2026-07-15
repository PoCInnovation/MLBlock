import pandas as pd


def train_test_split(dataset: "pd.DataFrame", ratio: "float" = 0.8, shuffle: "bool" = True, seed: "int" = None) -> "tuple[pd.DataFrame, pd.DataFrame]":
    """Séparer train/test.
    
    Args:
        dataset: Input tensor.
        ratio: Parameter.
        shuffle: Parameter.
        seed: Parameter.
    """
    from sklearn.model_selection import train_test_split as tts
    X = data.drop(columns=[target_column])
    y = data[target_column]
    return tts(X, y, test_size=test_size)
