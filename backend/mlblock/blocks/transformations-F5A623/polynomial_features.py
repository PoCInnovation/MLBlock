import pandas as pd


def polynomial_features(in_1: "pd.DataFrame", degree: "int" = 2) -> "pd.DataFrame":
    """Générer des features polynomiales.
    Ajoute les combinaisons polynomiales des colonnes numériques (degré donné).

    Args:
        in_1: Données d'entraînement.
        degree: Degré du polynôme (entre: 2-4, pas: 1).
    """
    from sklearn.preprocessing import PolynomialFeatures

    X = in_1.select_dtypes(include="number")
    pf = PolynomialFeatures(degree=degree, include_bias=False)
    cols = pf.get_feature_names_out(X.columns)
    return pd.DataFrame(pf.fit_transform(X), columns=cols, index=in_1.index)
