import base64
import gzip
import json

import requests
from typing import Any


def _is_gone_offer(exc: Exception) -> bool:
    """Offre prise entre search et PUT : HTTP 400/404/410 avec `no_such_ask`
    dans le corps (requests comme urllib)."""
    status = getattr(getattr(exc, "response", None), "status_code", None) or getattr(exc, "code", None)
    if status not in (400, 404, 410):
        return False
    body = ""
    resp = getattr(exc, "response", None)
    if resp is not None:
        try:
            body = resp.text or ""
        except Exception:
            body = ""
    if not body and hasattr(exc, "read"):
        try:
            raw = exc.read()
            body = raw.decode("utf-8", "replace") if isinstance(raw, bytes) else str(raw)
        except Exception:
            body = ""
    return "no_such_ask" in body


class VastAI:
    """Client REST Vast.ai — API v0 (docs.vast.ai/api-reference, OpenAPI 1.0.0).

    Tous les endpoints requièrent `Authorization: Bearer $VAST_API_KEY`
    (plus de `?api_key=` en query, format legacy).
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://console.vast.ai/api/v0"

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}"}

    def search_offers(self, gpu_name: str | None, num_gpus: int = 1, limit: int = 5) -> list[dict[str, Any]]:
        """POST /api/v0/bundles — filtres en objets opérateurs (eq/in/gt...).

        Le nom GPU s'envoie avec l'espace ("RTX 3090") : le format underscore
        documenté ("RTX_3090") retourne 0 offre sur l'API réelle.
        `gpu_name=None` omet le filtre : l'offre vérifiée la moins chère gagne
        (tri `dph_total` croissant conservé).
        """
        filters: dict[str, Any] = {
            "type": "on-demand",
            "verified": {"eq": True},
            "rentable": {"eq": True},
            "rented": {"eq": False},
            "num_gpus": {"eq": num_gpus},
            # Le moins cher brut a souvent une egress anémique (MNIST 6,5 min
            # observé à 86 Mbps) : plancher 1 Gbps + fiabilité, le surcoût
            # ($0.29 vs $0.12/h) est négligeable sur un run de 10 min.
            "inet_down": {"gt": 1000},
            "reliability2": {"gt": 0.95},
            "order": [["dph_total", "asc"]],
            "limit": limit,
        }
        if gpu_name is not None:
            filters["gpu_name"] = {"eq": gpu_name}
        r = requests.post(
            f"{self.base_url}/bundles",
            json=filters,
            headers=self._headers(),
            timeout=10,
        )
        r.raise_for_status()
        return r.json().get("offers", [])

    def launch_instance(
        self,
        gpu_name: str | None,
        num_gpus: int,
        image: str | None,
        disk: int,
        onstart: str | None = None,
        template_hash_id: str | None = None,
        label: str | None = None,
    ) -> dict[str, Any]:
        if not self.api_key or self.api_key.startswith("mock"):
            return {"id": "mock-instance-id"}

        try:
            offers = self.search_offers(gpu_name, num_gpus)
            if not offers:
                raise ValueError(f"No Vast.ai offers found for GPU: {gpu_name}")
            payload: dict[str, Any] = {
                "disk": disk,
                "target_state": "running",
            }
            if image is not None:
                payload["image"] = image
            if template_hash_id is not None:
                payload["template_hash_id"] = template_hash_id
            if label is not None:
                payload["label"] = label
            if onstart:
                # Script exécuté au boot de l'instance — évite le SSH pour lancer le code
                payload["onstart"] = self._encode_onstart(onstart)
            # Les offres fantômes (no_such_ask : prise entre search et PUT) se
            # sautent vers l'offre suivante au lieu de tuer le rent.
            for offer in offers:
                offer_id = offer["id"]
                print(
                    "Vast offer: id=%s gpu=%s dph=%s reliability=%s" % (
                        offer_id,
                        offer.get("gpu_name"),
                        offer.get("dph_total"),
                        offer.get("reliability2", offer.get("reliability")),
                    )
                )
                try:
                    # OpenAPI officiel : PUT /asks/{id} (vérifié en réel sur l'API)
                    res = requests.put(
                        f"{self.base_url}/asks/{offer_id}", json=payload, headers=self._headers(), timeout=15
                    )
                    res.raise_for_status()
                except Exception as e:
                    if _is_gone_offer(e):
                        print(f"Vast offer {offer_id} partie, suivante")
                        continue
                    raise
                # Key quirk : le create retourne `new_contract` comme ID d'instance (pas `id`).
                # `instance_api_key` : clé restreinte de l'instance (start/stop/destroy de
                # CETTE instance) — injectée par Vast dans le container comme
                # CONTAINER_API_KEY ; elle authentifie les callbacks GPU de ce job.
                data = res.json()
                instance_id = data.get("id") or data.get("new_contract")
                return {"id": str(instance_id), "api_key": data.get("instance_api_key", "")}
            raise ValueError(f"Toutes les offres Vast.ai sont parties ({len(offers)} essayées)")
        except Exception as e:
            print(f"Error launching Vast.ai instance: {e}")
            return {"id": "dummy-instance-id", "error": str(e)}

    @staticmethod
    def _encode_onstart(script: str) -> str:
        """onstart — Vast limite ~16 KB (CLI) / 4048 dans notre garde-fou.

        Au-delà, on gzip+base64 et on encapsule dans un shell qui décode
        côté instance :  echo '<b64>' | base64 -d | gunzip | bash
        (le serveur Vast n'auto-décode pas — cf. docs.vast.ai CLI hello-world).
        Le wrapper tient dans ~2.4 KB pour un script de 4.6 KB, donc sous la limite.
        """
        if len(script) <= 4048:
            return script
        b64 = base64.b64encode(gzip.compress(script.encode())).decode()
        # base64 alphabet ne contient pas de single-quote → wrapping sûr
        return f"echo '{b64}' | base64 -d | gunzip | bash"

    def list_instances(self, status: str | None = None) -> list[dict[str, Any]]:
        """GET /api/v1/instances — inventaire paginé (25 max), suit `next_token`.

        Colonnes minimales `id/label/actual_status`, filtre optionnel sur
        `actual_status`. Lève sur échec total (zéro page) pour que le reaper
        distingue panne Vast et inventaire vide ; page partielle après ≥1 page
        retournée telle quelle (amendement au plan Task 2).
        """
        if not self.api_key or self.api_key.startswith("mock"):
            return []
        url = self.base_url.replace("/api/v0", "/api/v1") + "/instances"
        params: dict[str, Any] = {"select_cols": json.dumps(["id", "label", "actual_status"])}
        if status is not None:
            params["select_filters"] = json.dumps({"actual_status": {"eq": status}})
        out: list[dict[str, Any]] = []
        try:
            while True:
                r = requests.get(url, params=params, headers=self._headers(), timeout=10)
                r.raise_for_status()
                data = r.json()
                out.extend(data.get("instances", []))
                token = data.get("next_token")
                if not token:
                    return out
                params = dict(params, after_token=token)
        except Exception as e:
            if out:
                print(f"Error listing Vast.ai instances (partial): {e}")
                return out
            raise

    def start_instance(self, instance_id: str) -> None:
        if not self.api_key or self.api_key.startswith("mock") or instance_id in (  # noqa: E501
            "dummy-instance-id",
            "local-instance-id",
            "mock-instance-id",
        ):
            return
        # PUT /instances/{id} avec body {"state": "running"} (manage instance)
        url = f"{self.base_url}/instances/{instance_id}"
        try:
            r = requests.put(url, json={"state": "running"}, headers=self._headers(), timeout=10)
            r.raise_for_status()
        except Exception as e:
            print(f"Error starting Vast.ai instance: {e}")

    def destroy_instance(self, instance_id: str) -> None:
        if not self.api_key or self.api_key.startswith("mock") or instance_id in (  # noqa: E501
            "dummy-instance-id",
            "local-instance-id",
            "mock-instance-id",
        ):
            return
        url = f"{self.base_url}/instances/{instance_id}"
        try:
            r = requests.delete(url, headers=self._headers(), timeout=10)
            r.raise_for_status()
        except Exception as e:
            print(f"Error destroying Vast.ai instance: {e}")
