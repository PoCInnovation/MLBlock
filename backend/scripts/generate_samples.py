"""Génère et uploade la bibliothèque de données d'exemple (français) vers le
bucket Supabase `sample-data` (public). Idempotent : upsert.

Usage : uv run python scripts/generate_samples.py   (depuis backend/)
"""
# ruff: noqa: E501 -- Les manifests de données d'exemple sont des littéraux
# compacts (lignes volontairement longues), pas du code formaté.
import json
import os
import random
import sys
from pathlib import Path

import numpy as np
import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SECRET = os.environ.get("SUPABASE_SECRET_KEY", "")
PROJECT = SUPABASE_URL.replace("https://", "").split(".")[0]
BUCKET = "sample-data"
STORAGE = f"{SUPABASE_URL}/storage/v1"

H = {"apikey": SECRET, "Authorization": f"Bearer {SECRET}"}
rng = random.Random(42)
np.random.seed(42)


def ensure_bucket() -> None:
    r = requests.post(f"{STORAGE}/bucket", headers=H, json={"name": BUCKET, "public": True}, timeout=15)
    if r.status_code not in (200, 201, 400):  # 400 = déjà existant
        raise RuntimeError(f"Création bucket: {r.status_code} {r.text[:200]}")


def upload(path: str, content: bytes) -> str:
    r = requests.post(
        f"{STORAGE}/object/{BUCKET}/{path}",
        headers={**H, "x-upsert": "true", "Content-Type": "application/octet-stream"},
        data=content,
        timeout=30,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Upload {path}: {r.status_code} {r.text[:200]}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"


def build_manifest() -> list[dict]:
    manifest = []
    out = Path("/tmp/mlblock-samples")
    out.mkdir(exist_ok=True)

    # ── tabulaire ──────────────────────────────────────────────
    rows = []
    villes = {"Paris": 6500, "Lyon": 4200, "Marseille": 3600, "Toulouse": 3300, "Nantes": 3000, "Lille": 2800}
    for _ in range(200):
        ville = rng.choice(list(villes))
        surface = round(rng.uniform(28, 210), 1)
        pieces = rng.randint(1, 8)
        etage = rng.randint(0, 15)
        prix = round(surface * villes[ville] + pieces * 18000 + rng.uniform(-15000, 15000))
        rows.append([surface, pieces, etage, ville, prix])
    (out / "immo.csv").write_text("\n".join(
        ["surface_m2,pieces,etage,ville,prix_euros"] + [",".join(map(str, r)) for r in rows]
    ), encoding="utf-8")
    manifest.append({"id": "immo", "name": "Prix de l'immobilier", "description": "Prix d'appartements selon la surface, les pièces, l'étage et la ville.", "category": "tabular", "path": "tabular/immo.csv", "url": f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/tabular/immo.csv", "columns": ["surface_m2", "pieces", "etage", "ville", "prix_euros"], "rows": 200})

    produits = [("T-shirt", "Vêtements", 15.0), ("Mug", "Maison", 9.5), ("Casque", "Électronique", 49.9),
                ("Sac", "Accessoires", 25.0), ("Lampe", "Maison", 19.9)]
    rows = []
    for _ in range(150):
        nom, cat, prix_u = rng.choice(produits)
        qte = rng.randint(1, 40)
        rows.append([nom, cat, prix_u, qte, round(prix_u * qte, 2)])
    (out / "ventes.csv").write_text("\n".join(
        ["produit,categorie,prix_unitaire,quantite,chiffre_affaires"] + [",".join(map(str, r)) for r in rows]
    ), encoding="utf-8")
    manifest.append({"id": "ventes", "name": "Ventes de produits", "description": "Chiffre d'affaires par produit, catégorie et quantité.", "category": "tabular", "path": "tabular/ventes.csv", "columns": ["produit", "categorie", "prix_unitaire", "quantite", "chiffre_affaires"], "rows": 150})

    rows = []
    for _ in range(100):
        heures = round(rng.uniform(0, 40), 1)
        assiduite = rng.randint(30, 100)
        moyenne = round(8 + heures * 0.25 + assiduite * 0.04 + rng.uniform(-2, 2), 2)
        rows.append([heures, assiduite, max(0, min(20, moyenne))])
    (out / "etudiants.csv").write_text("\n".join(
        ["heures_etude,assiduite,moyenne"] + [",".join(map(str, r)) for r in rows]
    ), encoding="utf-8")
    manifest.append({"id": "etudiants", "name": "Notes d'étudiants", "description": "Moyenne selon les heures d'étude et l'assiduité.", "category": "tabular", "path": "tabular/etudiants.csv", "columns": ["heures_etude", "assiduite", "moyenne"], "rows": 100})

    rows = []
    for _ in range(200):
        anciennete = rng.randint(1, 60)
        depense = round(rng.uniform(10, 400), 2)
        reclamations = rng.randint(0, 5)
        p = min(0.9, 0.05 + anciennete * 0.004 + reclamations * 0.08 - depense * 0.0003)
        rows.append([anciennete, depense, reclamations, 1 if rng.random() < p else 0])
    (out / "clients.csv").write_text("\n".join(
        ["anciennete_mois,depense_mensuelle,reclamations,a_resilie"] + [",".join(map(str, r)) for r in rows]
    ), encoding="utf-8")
    manifest.append({"id": "clients", "name": "Fidélisation clients", "description": "Résiliation selon l'ancienneté, la dépense et les réclamations.", "category": "tabular", "path": "tabular/clients.csv", "columns": ["anciennete_mois", "depense_mensuelle", "reclamations", "a_resilie"], "rows": 200})

    # ── séries ─────────────────────────────────────────────────
    rows = []
    for d in range(365):
        jour = d % 365
        saison = 8 + 9 * np.sin(2 * np.pi * jour / 365 - 1.5)
        temp = round(saison + rng.uniform(-4, 4), 1)
        pluie = round(max(0, rng.gauss(1.5, 2.0)), 1)
        rows.append([f"2025-{1 + d // 28:02d}-{1 + (d % 28):02d}", temp, pluie])
    (out / "meteo.csv").write_text("\n".join(
        ["date,temperature_c,precipitations_mm"] + [",".join(map(str, r)) for r in rows]
    ), encoding="utf-8")
    manifest.append({"id": "meteo", "name": "Météo quotidienne", "description": "Température et précipitations sur une année (saisons).", "category": "series", "path": "series/meteo.csv", "columns": ["date", "temperature_c", "precipitations_mm"], "rows": 365})

    rows = []
    for d in range(180):
        visites = int(400 + 30 * d + 120 * np.sin(2 * np.pi * d / 7) + rng.gauss(0, 60))
        rows.append([f"2025-{(d // 28) + 1:02d}-{1 + (d % 28):02d}", visites, int(visites * rng.uniform(0.05, 0.12))])
    (out / "trafic.csv").write_text("\n".join(
        ["date,visites,commandes"] + [",".join(map(str, r)) for r in rows]
    ), encoding="utf-8")
    manifest.append({"id": "trafic", "name": "Trafic du site", "description": "Visites et commandes journalières (tendance + saisonnalité hebdo).", "category": "series", "path": "series/trafic.csv", "columns": ["date", "visites", "commandes"], "rows": 180})

    # ── texte ──────────────────────────────────────────────────
    pos = ["Très bon produit, je recommande vivement.", "Excellent rapport qualité-prix, superbe achat.",
           "Livraison rapide et emballage soigné, je suis ravi.", "Parfait, conforme à la description.",
           "Qualité au top, je rachèterai sans hésiter.", "Service client réactif et aimable.",
           "Un sans-faute, du début à la fin.", "Je suis conquis, rien à redire.",
           "Produit solide et bien fini, bravo.", "Expérience d'achat agréable, merci."]
    neg = ["Produit décevant, ne correspond pas à l'annonce.", "Qualité médiocre, je regrette cet achat.",
           "Livraison très lente et suivi inexistant.", "Article arrivé abîmé, dommage.",
           "Service client injoignable, mauvaise expérience.", "Je ne recommande pas, trop cher pour ce que c'est.",
           "Fonctionne mal dès la première utilisation.", "Délais non respectés, frustrant.",
           "Description trompeuse, je suis déçu.", "Produit fragile et peu fiable."]
    neu = ["Produit reçu en trois jours.", "L'article correspond globalement à la description.",
           "Délai de livraison standard, rien de spécial.", "Utilisation simple, pas de surprise.",
           "Le rapport qualité-prix est correct sans plus.", "Emballage classique, produit fonctionnel.",
           "Achat sans problème particulier.", "Assez satisfait, quelques réserves mineures.",
           "Produit moyen, il fait le travail.", "Expérience d'achat ordinaire."]
    rows = []
    for i in range(60):
        pool = pos if i < 20 else (neg if i < 40 else neu)
        rows.append([pool[i % 10], "positif" if i < 20 else ("negatif" if i < 40 else "neutre")])
    (out / "avis_clients.csv").write_text("\n".join(
        ["texte,sentiment"] + [",".join(f'"{r[0]}",{r[1]}') for r in rows]
    ), encoding="utf-8")
    manifest.append({"id": "avis-clients", "name": "Avis clients", "description": "60 avis clients en français avec sentiment (positif/négatif/neutre).", "category": "text", "path": "text/avis_clients.csv", "columns": ["texte", "sentiment"], "rows": 60})

    # ── image ──────────────────────────────────────────────────
    from PIL import Image, ImageDraw
    shapes = [
        ("cercle", (230, 80, 80)),
        ("carre", (80, 150, 230)),
        ("triangle", (90, 200, 120)),
        ("croix", (230, 180, 60)),
    ]
    for name, color in shapes:
        img = Image.new("RGB", (64, 64), (250, 250, 250))
        d = ImageDraw.Draw(img)
        if name == "cercle":
            d.ellipse((14, 14, 50, 50), fill=color)
        elif name == "carre":
            d.rectangle((16, 16, 48, 48), fill=color)
        elif name == "triangle":
            d.polygon([(32, 12), (12, 52), (52, 52)], fill=color)
        else:
            d.rectangle((28, 12, 36, 52), fill=color)
            d.rectangle((12, 28, 52, 36), fill=color)
        img.save(out / f"{name}.png")
        manifest.append({"id": f"forme-{name}", "name": f"Forme {name}", "description": f"Image 64×64 d'un {name} coloré sur fond clair.", "category": "image", "path": f"image/{name}.png", "columns": [], "rows": 1})

    for item in manifest:
        item["url"] = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{item['path']}"
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return out


def main() -> None:
    if not SECRET or not PROJECT:
        sys.exit("SUPABASE_SECRET_KEY / SUPABASE_URL manquants dans backend/.env")
    ensure_bucket()
    out = build_manifest()
    manifest = _manifest_from(out)
    urls = {}
    upload("manifest.json", (out / "manifest.json").read_bytes())
    for item in manifest:
        local = out / item["path"].split("/")[-1]
        urls[item["id"]] = upload(item["path"], local.read_bytes())
    print(f"{len(urls)} samples uploadés vers {BUCKET}")
    for sid, url in urls.items():
        print(f"  {sid:14} {url}")


def _manifest_from(out: Path) -> list[dict]:
    return json.loads((out / "manifest.json").read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
