def df_to_tensor(in_1: "pd.DataFrame") -> "torch.Tensor":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Convertir un DataFrame en tenseur.
    Convertit un DataFrame en tenseur float32.

    Args:
        in_1: DataFrame numérique à convertir.
    """
    import torch
    return torch.from_numpy(in_1.values.astype("float32"))
