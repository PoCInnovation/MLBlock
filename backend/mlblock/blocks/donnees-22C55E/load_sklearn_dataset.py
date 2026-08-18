import pandas as pd


def load_sklearn_dataset(name: "str", target: "str" = "target") -> "pd.DataFrame":
    """Charger un dataset sklearn.
    Charge un dataset classique (iris, digits, wine, breast_cancer) avec sa
    colonne cible.

    Args:
        name: Dataset (choix: iris|digits|wine|breast_cancer).
        target: Nom de la colonne cible.
    """
    from sklearn import datasets as sk_datasets

    loaders = {
        "iris": sk_datasets.load_iris,
        "digits": sk_datasets.load_digits,
        "wine": sk_datasets.load_wine,
        "breast_cancer": sk_datasets.load_breast_cancer,
    }
    if name not in loaders:
        raise ValueError(f"Dataset inconnu : {name} (choix: iris|digits|wine|breast_cancer)")
    data = loaders[name](as_frame=True)
    df = data.frame
    df[target] = data.target
    return df
