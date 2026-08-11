import os
from fastapi import Depends, Header, HTTPException, Request
from sqlmodel import Session

from mlblock.server.database import get_session

GPU_API_KEY = os.environ.get("GPU_API_KEY", "mock-gpu-key-for-testing")


def verify_gpu_key(
    authorization: str = Header(...),
    request: Request = None,
    session: Session = Depends(get_session),
) -> str:
    """Authentifie les callbacks GPU.

    Depuis gpu-instance-auth : le Bearer attendu est la clé d'instance du job
    (`job.instance_api_key`, clé Vast restreinte injectée dans le container
    comme CONTAINER_API_KEY) avec repli sur le GPU_API_KEY global pour les
    jobs legacy et le mode local (instance_api_key vide).
    """
    expected = GPU_API_KEY
    job_id = request.path_params.get("job_id")
    if job_id:
        from mlblock.server.models import Job

        job = session.get(Job, job_id)
        if job and job.instance_api_key:
            expected = job.instance_api_key
    if not authorization.startswith("Bearer ") or authorization[7:] != expected:
        raise HTTPException(status_code=403, detail="Invalid GPU key")
    return "gpu"
