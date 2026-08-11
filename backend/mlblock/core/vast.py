import base64
import gzip
import requests
from typing import Any


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

    def search_offers(self, gpu_name: str, num_gpus: int = 1, limit: int = 5) -> list[dict[str, Any]]:
        """POST /api/v0/bundles — filtres en objets opérateurs (eq/in/gt...).

        Le nom GPU s'envoie avec l'espace ("RTX 3090") : le format underscore
        documenté ("RTX_3090") retourne 0 offre sur l'API réelle.
        """
        r = requests.post(
            f"{self.base_url}/bundles",
            json={
                "type": "ondemand",
                "gpu_name": {"eq": gpu_name},
                "verified": {"eq": True},
                "rentable": {"eq": True},
                "rented": {"eq": False},
                "num_gpus": {"eq": num_gpus},
                "order": [["dph_total", "asc"]],
                "limit": limit,
            },
            headers=self._headers(),
            timeout=10,
        )
        r.raise_for_status()
        return r.json().get("offers", [])

    def launch_instance(self, gpu_name: str, num_gpus: int, image: str, disk: int, onstart: str | None = None) -> dict[str, Any]:
        if not self.api_key or self.api_key.startswith("mock"):
            return {"id": "mock-instance-id"}

        try:
            offers = self.search_offers(gpu_name, num_gpus)
            if not offers:
                raise ValueError(f"No Vast.ai offers found for GPU: {gpu_name}")
            # Rent the first (cheapest) available offer
            offer_id = offers[0]["id"]
            payload: dict[str, Any] = {
                "image": image,
                "disk": disk,
                "target_state": "running",
            }
            if onstart:
                # Script exécuté au boot de l'instance — évite le SSH pour lancer le code
                payload["onstart"] = self._encode_onstart(onstart)
            # OpenAPI officiel : PUT /asks/{id} (vérifié en réel sur l'API)
            res = requests.put(f"{self.base_url}/asks/{offer_id}", json=payload, headers=self._headers(), timeout=15)
            res.raise_for_status()
            # Key quirk : le create retourne `new_contract` comme ID d'instance (pas `id`)
            instance_id = res.json().get("id") or res.json().get("new_contract")
            return {"id": str(instance_id)}
        except Exception as e:
            print(f"Error launching Vast.ai instance: {e}")
            return {"id": "dummy-instance-id"}

    @staticmethod
    def _encode_onstart(script: str) -> str:
        """onstart limité à 4048 caractères — gzip+base64 au-delà (doc Vast).

        Le serveur décompresse le payload encodé au boot de l'instance.
        """
        if len(script) <= 4048:
            return script
        return base64.b64encode(gzip.compress(script.encode())).decode()

    def start_instance(self, instance_id: str) -> None:
        if not self.api_key or self.api_key.startswith("mock") or instance_id == "dummy-instance-id":
            return
        # PUT /instances/{id} avec body {"state": "running"} (manage instance)
        url = f"{self.base_url}/instances/{instance_id}"
        try:
            r = requests.put(url, json={"state": "running"}, headers=self._headers(), timeout=10)
            r.raise_for_status()
        except Exception as e:
            print(f"Error starting Vast.ai instance: {e}")

    def destroy_instance(self, instance_id: str) -> None:
        if not self.api_key or self.api_key.startswith("mock") or instance_id == "dummy-instance-id":
            return
        url = f"{self.base_url}/instances/{instance_id}"
        try:
            r = requests.delete(url, headers=self._headers(), timeout=10)
            r.raise_for_status()
        except Exception as e:
            print(f"Error destroying Vast.ai instance: {e}")
