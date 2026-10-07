from __future__ import annotations

import os
import re
import uuid

import requests
from sqlmodel import Session, func, select

from mlblock.server.models import FileAsset

BUCKET = "user-uploads"


def _supabase() -> tuple[str, str]:
    """(base storage REST, secret) — même pattern que routes._delete_file_from_storage."""
    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    project = base.replace("https://", "").split(".")[0]
    return f"https://{project}.supabase.co/storage/v1", os.environ.get("SUPABASE_SECRET_KEY", "")


def _sanitize(name: str) -> str:
    stem, dot, ext = name.rpartition(".")
    safe = re.sub(r"[^a-zA-Z0-9_-]+", "-", stem or "fichier").strip("-") or "fichier"
    return f"{safe}.{ext.lower()}" if dot else safe


def build_storage_path(owner_id: uuid.UUID, asset_id: uuid.UUID, name: str) -> str:
    """{owner}/{asset}_{nom} : unicité par ID, extension réelle conservée."""
    return f"{owner_id}/{asset_id}_{_sanitize(name)}"


def delete_storage_object(bucket: str, path: str) -> None:
    """Supprime un objet par chemin (même pending sans public_url) — anti-orphelins."""
    storage, secret = _supabase()
    if not secret or not storage.startswith("https://"):
        return
    try:
        requests.delete(
            f"{storage}/object/{bucket}/{path}",
            headers={"apikey": secret, "Authorization": f"Bearer {secret}"},
            timeout=10,
        )
    except Exception:
        pass


def public_url(bucket: str, path: str) -> str:
    storage, _ = _supabase()
    return f"{storage}/object/public/{bucket}/{path}"


def sign_upload_url(bucket: str, path: str) -> str:
    """URL signée d'écriture : le frontend PUT en direct, le secret ne sort jamais."""
    storage, secret = _supabase()
    r = requests.post(
        f"{storage}/object/upload/sign/{bucket}/{path}",
        headers={"apikey": secret, "Authorization": f"Bearer {secret}"},
        json={},
        timeout=10,
    )
    r.raise_for_status()
    data = r.json()
    # REST renvoie {"url": "/object/upload/sign/...?token=.."} (relatif) ;
    # le client JS l'appelle signedUrl une fois préfixé — on accepte les deux.
    rel = data.get("url") or data.get("signedUrl") or ""
    if rel.startswith("http"):
        return rel
    if not rel:
        raise RuntimeError(f"Réponse de signature inattendue: {str(data)[:120]}")
    return f"{storage}{rel}" if rel.startswith("/") else f"{storage}/{rel}"


def quota_used(session: Session, owner_id: uuid.UUID) -> int:
    """Octets réservés : ready + pending non expirés (les expirés ne comptent plus)."""
    from datetime import datetime, timezone

    total = session.exec(
        select(func.coalesce(func.sum(FileAsset.size_bytes), 0)).where(
            FileAsset.owner_id == owner_id,
            FileAsset.status.in_(["ready", "pending"]),
            FileAsset.expires_at > datetime.now(timezone.utc),
        )
    ).one()
    return int(total)


_EXT_KINDS = {
    "csv": "csv",
    "tsv": "csv",
    "txt": "text",
    "md": "text",
    "png": "image",
    "jpg": "image",
    "jpeg": "image",
    "webp": "image",
    "gif": "image",
    "pt": "model",
    "pth": "model",
    "pkl": "model",
    "onnx": "model",
    "safetensors": "model",
    "wav": "audio",
    "mp3": "audio",
    "ogg": "audio",
    "flac": "audio",
}


def _ext_kind(ext: str) -> str:
    return _EXT_KINDS.get(ext.lower(), "other")


def _content_compatible(content_kind: str, ext_kind: str) -> bool:
    """Contenu cohérent avec l'extension : égal, famille csv/text, ou extension inconnue."""
    if ext_kind == "other" or content_kind == ext_kind:
        return True
    return {ext_kind, content_kind} <= {"csv", "text"}


def sniff_kind(head: bytes, filename: str) -> str:
    """Nature réelle du contenu : magie d'abord, extension ensuite, jamais le mime client."""
    if head.startswith(b"\x89PNG") or head.startswith(b"\xff\xd8\xff"):
        return "image"
    if head.startswith(b"RIFF") and b"WAVE" in head[:16]:
        return "audio"
    if head.startswith(b"PK\x03\x04"):
        return "model"
    ext = filename.rpartition(".")[2].lower() if "." in filename else ""
    if _ext_kind(ext) == "image":
        return "image"
    if _ext_kind(ext) == "model":
        return "model"
    if _ext_kind(ext) == "audio":
        return "audio"
    sample = head[:4096]
    if b"\x00" in sample or sample.startswith(b"MZ"):
        return "other"
    try:
        text = sample.decode("utf-8", errors="strict")
    except UnicodeDecodeError:
        return "other"
    first = text.splitlines()[0] if text.strip() else ""
    if "," in first or ";" in first or "\t" in first:
        return "csv"
    return "text"
