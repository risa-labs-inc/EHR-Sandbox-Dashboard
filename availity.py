"""Availity clearinghouse — sample outputs and platform-guide downloads."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from bestrx import MASTER_LABEL

_DIR = Path(__file__).resolve().parent
SAMPLE_DIR = _DIR / "sample_outputs" / "availity"

# api.id -> (sample file prefix, display name, endpoint map by method)
_SAMPLE_APIS: dict[str, dict[str, Any]] = {
    "coverages": {
        "prefix": "coverage",
        "name": "Eligibility & Benefits (Coverages)",
        "endpoints": {
            "POST": "POST /availity/v1/coverages",
            "GET": "GET /availity/v1/coverages/{id}",
        },
    },
    "claim-status": {
        "prefix": "claim",
        "name": "Claim Status",
        "endpoints": {
            "POST": "POST /availity/v1/claim-statuses",
            "GET": "GET /availity/v1/claim-statuses/{id}",
        },
    },
    "service-reviews": {
        "prefix": "service_review",
        "name": "Service Reviews 2.0",
        "endpoints": {
            "POST": "POST /availity/v2/service-reviews",
            "GET": "GET /availity/v2/service-reviews/{id}",
        },
    },
    "isauthrequired": {
        "prefix": "isauthrequired",
        "name": "IsAuthRequired",
        "endpoints": {
            "POST": "POST /value-adds/v1/isauthrequired",
            "GET": "GET /value-adds/v1/isauthrequired/{id}",
        },
    },
    "auth-attachments": {
        "prefix": "attachment",
        "name": "Attachments — Auth",
        "endpoints": {
            "POST": "POST /value-adds/v2/attachments",
            "GET": "GET /value-adds/v2/attachments/{id}",
        },
    },
    "payer-list": {
        "prefix": "payer_list",
        "name": "Payer List",
        "endpoints": {"GET": "GET /availity/v1/availity-payer-list"},
    },
}

AVAILITY_API_IDS: tuple[str, ...] = tuple(_SAMPLE_APIS.keys())


def list_availity_previews() -> list[dict[str, Any]]:
    return [{"slot": "master", "label": MASTER_LABEL, "is_master": True}]


def list_availity_downloads() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for meta in _SAMPLE_APIS.values():
        prefix = meta["prefix"]
        for method, endpoint in meta["endpoints"].items():
            fname = f"{prefix}_{method}.json"
            path = SAMPLE_DIR / fname
            if not path.is_file():
                continue
            rows.append(
                {
                    "api": meta["name"],
                    "endpoint": endpoint,
                    "filename": fname,
                    "slot_key": fname.replace(".json", ""),
                }
            )
    return rows


def resolve_availity_sample(filename: str) -> Path | None:
    if "/" in filename or ".." in filename:
        return None
    if not filename.endswith(".json"):
        filename = f"{filename}.json"
    path = SAMPLE_DIR / filename
    return path if path.is_file() else None


def resolve_availity_download(slot: str) -> Path | None:
    return resolve_availity_sample(f"{slot}.json" if not slot.endswith(".json") else slot)
