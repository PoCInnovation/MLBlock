"""Reaper orphelines Vast.ai — hors process web (Cron, pas de Timer).

Croise l'inventaire Vast (`GET /api/v1/instances`, labels `mlblock-{job_id}`)
avec la table `jobs` (registre) et détruit selon 4 règles. Usage :
`uv run python -m mlblock.reap`.
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from mlblock.execution import VastBackend, cleanup_pipeline_files

LABEL_PREFIX = "mlblock-"
TERMINAL_STATES = ("done", "error", "cancelled")
ACTIVE_STATES = ("dispatched", "running")
LIVE_STATES = ("running", "loading")
DEAD_STATES = ("exited", "unknown", "offline")


def _uuid_from_label(label: str | None) -> UUID | None:
    if not label or not label.startswith(LABEL_PREFIX):
        return None
    try:
        return UUID(label[len(LABEL_PREFIX):])
    except ValueError:
        return None


def _age_s(created_at: datetime, now: datetime) -> float:
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return (now - created_at).total_seconds()


def main(grace_s: int = 600, timeout_s: int = 1800) -> int:
    from sqlmodel import Session as SqlSession
    from sqlmodel import select as _select

    from mlblock.server.database import _get_engine
    from mlblock.server.models import Job

    now = datetime.now(timezone.utc)
    vast = VastBackend()
    try:
        instances = vast.list_instances()
    except Exception as e:
        print(f"reaper: inventaire impossible : {e}")
        return 0

    destroyed = 0

    def _destroy(instance_id, reason: str) -> None:
        nonlocal destroyed
        print(f"destroy {instance_id} {reason}")
        vast.destroy(instance_id)
        destroyed += 1

    with SqlSession(_get_engine()) as s:
        jobs = {str(j.id): j for j in s.exec(_select(Job)).all()}
        for inst in instances:
            iid = inst.get("id")
            status = inst.get("actual_status")
            job = jobs.get(str(_uuid_from_label(inst.get("label"))))
            if job is None:
                if status in LIVE_STATES:
                    _destroy(iid, "orpheline sans job")
                continue
            if job.status in TERMINAL_STATES:
                if status in LIVE_STATES:
                    _destroy(iid, "job terminal")
                continue
            if job.status not in ACTIVE_STATES:
                continue
            if _age_s(job.created_at, now) < grace_s:
                continue
            if status in DEAD_STATES:
                job.status = "error"
                job.error = f"Instance Vast.ai {status} : arrêt sans callback (poll trap)"
                job.completed_at = now
                s.add(job)
                _destroy(iid, f"poll trap {status}")
                cleanup_pipeline_files(job.pipeline_id)
                continue
            if _age_s(job.created_at, now) > timeout_s:
                job.status = "error"
                job.error = f"GPU TIMEOUT : job non terminé en {timeout_s}s"
                job.completed_at = now
                s.add(job)
                _destroy(iid, "timeout")
                cleanup_pipeline_files(job.pipeline_id)
                continue
        # Jobs actifs vieux sans instance Vast : erreur sans destroy (rien à détruire).
        seen_ids = {str(_uuid_from_label(i.get("label"))) for i in instances}
        for key, job in jobs.items():
            if (
                job.status in ACTIVE_STATES
                and key not in seen_ids
                and _age_s(job.created_at, now) > timeout_s
            ):
                job.status = "error"
                job.error = f"GPU TIMEOUT : instance introuvable après {timeout_s}s"
                job.completed_at = now
                s.add(job)
        s.commit()
    return destroyed


if __name__ == "__main__":
    raise SystemExit(main())
