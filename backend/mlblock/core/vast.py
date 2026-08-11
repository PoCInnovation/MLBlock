import os
import requests
from typing import Any


class VastAI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://console.vast.ai/api/v0"

    def launch_instance(self, gpu_name: str, num_gpus: int, image: str, disk: int, onstart: str | None = None) -> dict[str, Any]:
        if not self.api_key or self.api_key.startswith("mock"):
            return {"id": "mock-instance-id"}

        # q doit être un JSON stringifié et URL-encodé (format API Vast)
        import json as _json
        import urllib.parse
        q = _json.dumps({"type": "on-demand", "gpu_name": gpu_name, "verified": True, "external": False})
        search_url = f"{self.base_url}/asks/?q={urllib.parse.quote(q)}&api_key={self.api_key}"
        try:
            r = requests.get(search_url, timeout=10)
            r.raise_for_status()
            offers = r.json().get("offers", [])
            if not offers:
                raise ValueError(f"No Vast.ai offers found for GPU: {gpu_name}")
            # Rent the first available offer
            offer_id = offers[0]["id"]
            rent_url = f"{self.base_url}/asks/{offer_id}/?api_key={self.api_key}"
            payload: dict[str, Any] = {"image": image, "disk": disk}
            if onstart:
                # Script exécuté au boot de l'instance — évite le SSH pour lancer le code
                payload["onstart"] = onstart
            res = requests.post(rent_url, json=payload, timeout=10)
            res.raise_for_status()
            instance_id = res.json().get("id") or res.json().get("new_contract")
            return {"id": str(instance_id)}
        except Exception as e:
            print(f"Error launching Vast.ai instance: {e}")
            return {"id": "dummy-instance-id"}

    def start_instance(self, instance_id: str) -> None:
        if not self.api_key or self.api_key.startswith("mock") or instance_id == "dummy-instance-id":
            return
        url = f"{self.base_url}/instances/{instance_id}/state/?api_key={self.api_key}"
        try:
            r = requests.put(url, json={"state": "running"}, timeout=10)
            r.raise_for_status()
        except Exception as e:
            print(f"Error starting Vast.ai instance: {e}")

    def destroy_instance(self, instance_id: str) -> None:
        if not self.api_key or self.api_key.startswith("mock") or instance_id == "dummy-instance-id":
            return
        url = f"{self.base_url}/instances/{instance_id}/?api_key={self.api_key}"
        try:
            r = requests.delete(url, timeout=10)
            r.raise_for_status()
        except Exception as e:
            print(f"Error destroying Vast.ai instance: {e}")
