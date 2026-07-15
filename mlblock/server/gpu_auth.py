import os
from fastapi import Header, HTTPException

GPU_API_KEY = os.environ.get("GPU_API_KEY", "mock-gpu-key-for-testing")


def verify_gpu_key(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer ") or authorization[7:] != GPU_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid GPU key")
    return "gpu"
