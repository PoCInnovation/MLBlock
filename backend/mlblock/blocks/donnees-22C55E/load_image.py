import io

import requests


def load_image(path: "file") -> "PIL.Image.Image":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Load Image.
    Télécharge un fichier image (URL stockée) et retourne l'image PIL.

    Args:
        path: URL du fichier image. (format: .png|.jpg)
    """
    from PIL import Image

    try:
        r = requests.get(path, timeout=30)
        r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Image illisible ({e}) — vérifie qu'elle existe ou réimporte-la") from e
