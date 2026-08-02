from __future__ import annotations

from dataclasses import asdict, dataclass
from hashlib import sha256
import json
from pathlib import Path
from queue import Queue
from threading import Lock, Thread
from typing import Protocol
import shutil
import re

LEVELS = frozenset({"A2", "B1", "B2", "C1", "C2"})
DISALLOWED_IMAGE_TERMS = frozenset({
    "blood", "corpse", "drug", "gun", "injury", "naked", "nsfw", "porn", "rifle", "sexual", "weapon",
})

class InvalidImageRequest(ValueError):
    pass

@dataclass(frozen=True)
class VocabularyImageRequest:
    term: str
    meaning: str
    context: str
    level: str

    @classmethod
    def from_unknown(cls, value: object) -> "VocabularyImageRequest":
        if not isinstance(value, dict) or set(value) != {"term", "meaning", "context", "level"}:
            raise InvalidImageRequest("Expected term, meaning, context, and level only")
        limits = {"term": 100, "meaning": 500, "context": 1000}
        normalized: dict[str, str] = {}
        for field, limit in limits.items():
            candidate = value.get(field)
            if not isinstance(candidate, str) or not candidate.strip() or len(candidate.strip()) > limit:
                raise InvalidImageRequest(f"Invalid {field}")
            normalized[field] = candidate.strip()
        level = value.get("level")
        if not isinstance(level, str) or level not in LEVELS:
            raise InvalidImageRequest("Invalid level")
        searchable = set(re.findall(r"[a-z]+", " ".join(normalized.values()).casefold()))
        if searchable & DISALLOWED_IMAGE_TERMS:
            raise InvalidImageRequest("Concept is not eligible for automatic illustration")
        return cls(level=level, **normalized)

    @property
    def job_id(self) -> str:
        canonical = json.dumps(asdict(self), ensure_ascii=True, sort_keys=True, separators=(",", ":"))
        return sha256(canonical.encode()).hexdigest()[:24]

    def controlled_prompt(self) -> str:
        return " ".join((
            "Create one friendly educational illustration for an English vocabulary exercise.",
            f"Target concept: {self.term}.", f"Meaning: {self.meaning}.",
            f"Scene context: {self.context}.", f"Learner level: {self.level}.",
            "Show a clear everyday scene with no written words, letters, captions, logos, brands, celebrities, frightening imagery, weapons, injuries, sexual content, or age-inappropriate content.",
            "Use a clean colorful editorial illustration style and make the target concept visually central.",
        ))

class ImageEngine(Protocol):
    def generate(self, prompt: str, destination: Path) -> "SafetyDecision": ...

@dataclass(frozen=True)
class SafetyDecision:
    safe: bool
    checked_by: str

@dataclass
class ImageJob:
    id: str
    status: str
    error: str | None = None
    image_path: str | None = None
    def public(self) -> dict[str, str | None]:
        return {"id": self.id, "status": self.status, "error": self.error, "imagePath": self.image_path}

class ImageQueue:
    """One-consumer queue; unchecked output never receives a public URL."""
    def __init__(self, engine: ImageEngine, quarantine: Path, approved: Path, start_worker: bool = True):
        self._engine, self._quarantine, self._approved = engine, quarantine, approved
        self._queue: Queue[tuple[VocabularyImageRequest, ImageJob]] = Queue()
        self._jobs: dict[str, ImageJob] = {}
        self._lock = Lock()
        if start_worker:
            Thread(target=self._consume, daemon=True, name="image-generation-worker").start()

    def submit(self, request: VocabularyImageRequest) -> tuple[ImageJob, bool]:
        with self._lock:
            existing = self._jobs.get(request.job_id)
            if existing is not None:
                return existing, False
            approved_file = self._approved / f"{request.job_id}.png"
            if approved_file.is_file():
                job = ImageJob(request.job_id, "ready", image_path=f"/v1/images/files/{request.job_id}")
                self._jobs[job.id] = job
                return job, False
            job = ImageJob(request.job_id, "queued")
            self._jobs[job.id] = job
            self._queue.put((request, job))
            return job, True

    def get(self, job_id: str) -> ImageJob | None:
        with self._lock:
            return self._jobs.get(job_id)

    def _consume(self) -> None:
        while True:
            request, job = self._queue.get()
            try:
                job.status = "generating"
                destination = self._quarantine / f"{job.id}.png"
                destination.parent.mkdir(parents=True, exist_ok=True)
                decision = self._engine.generate(request.controlled_prompt(), destination)
                if not decision.safe:
                    destination.unlink(missing_ok=True)
                    job.status, job.error = "rejected", "Image did not pass the local safety check"
                else:
                    self._approved.mkdir(parents=True, exist_ok=True)
                    shutil.move(destination, self._approved / destination.name)
                    job.status = "ready"
                    job.image_path = f"/v1/images/files/{job.id}"
            except Exception:
                job.status, job.error = "failed", "Local image generation failed"
            finally:
                self._queue.task_done()

    def approved_file(self, job_id: str) -> Path | None:
        if len(job_id) != 24 or any(character not in "0123456789abcdef" for character in job_id):
            return None
        candidate = self._approved / f"{job_id}.png"
        return candidate if candidate.is_file() else None
