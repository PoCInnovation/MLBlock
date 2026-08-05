def train_test_split(dataset: "pd.DataFrame", ratio: "float" = 0.8, shuffle: "bool" = True, seed: "int" = None) -> "tuple[pd.DataFrame, pd.DataFrame]":
    """Séparer train/test.

    Args:
        dataset: DataFrame à séparer.
        ratio: Proportion d'entraînement.
        shuffle: Mélanger avant la séparation.
        seed: Graine aléatoire.
    """
    from sklearn.model_selection import train_test_split as tts
    train, test = tts(dataset, train_size=ratio, shuffle=shuffle, random_state=seed)
    return train, test
