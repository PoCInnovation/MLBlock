import io

import requests


def load_image(path: "file") -> "PIL.Image.Image":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Charger une image.
    Télécharge un fichier image (URL stockée) et retourne l'image PIL.

    Args:
        path: URL du fichier image.
    """
    from PIL import Image

    r = requests.get(path, timeout=30)
    r.raise_for_status()
    return Image.open(io.BytesIO(r.content)).convert("RGB")
