"""Load BestRx pharmacy-management sample responses into dashboard sections.

Unlike the EHR loaders (which flatten FHIR into a fixed key set), BestRx
responses are arbitrary nested JSON, so this builds a recursive section /
field tree and a `field_src` provenance map keyed by each field's data point
(e.g. ``patient.unique_patient_id`` -> {resource, path}). Only populated
fields are emitted.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

_DIR = Path(__file__).resolve().parent
_BESTRX_DIR = _DIR / "sample_outputs" / "bestrx"

PATIENT_FILE = _BESTRX_DIR / "patient_get_patient.json"
DRUG_FILE = _BESTRX_DIR / "drug_get_drug_information.json"

MASTER_LABEL = "\u2605 Master"
_MULTILINE_THRESHOLD = 80


def list_bestrx_previews() -> list[dict[str, Any]]:
    """Home-card / selector entries. We ship a single merged 'master' sample."""
    return [{"slot": "master", "label": MASTER_LABEL, "is_master": True}]


def _is_scalar(v: Any) -> bool:
    return v is None or isinstance(v, (str, int, float, bool))


def _is_empty(v: Any) -> bool:
    return v is None or (isinstance(v, str) and v.strip() == "")


def _fmt(v: Any) -> str:
    if isinstance(v, bool):
        return "true" if v else "false"
    return str(v)


def _label(key: str) -> str:
    s = str(key).replace("_", " ")
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", s)
    s = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", s)
    return s.strip().title()


def _field_node(field_id: str, label: str, value: Any, resource: str, field_src: dict) -> dict:
    field_src[field_id] = {"resource": resource, "path": field_id}
    return {
        "type": "field",
        "id": field_id,
        "label": label,
        "value": _fmt(value),
        "multiline": isinstance(value, str) and len(value) > _MULTILINE_THRESHOLD,
    }


def _build_nodes(obj: dict, resource: str, base: str, field_src: dict) -> list[dict]:
    """Scalar entries become fields; nested objects/arrays become groups. Empty values skipped."""
    nodes: list[dict] = []
    scalars = [(k, v) for k, v in obj.items() if _is_scalar(v)]
    complex_ = [(k, v) for k, v in obj.items() if not _is_scalar(v)]

    for k, v in scalars:
        if _is_empty(v):
            continue
        nodes.append(_field_node(f"{base}.{k}", _label(k), v, resource, field_src))

    for k, v in complex_:
        group = _build_group(k, v, resource, f"{base}.{k}", field_src)
        if group:
            nodes.append(group)

    return nodes


def _build_group(key: str, value: Any, resource: str, path: str, field_src: dict) -> dict | None:
    if isinstance(value, list):
        items = [it for it in value if not (_is_scalar(it) and _is_empty(it))]
        if not items:
            return None
        children: list[dict] = []
        if all(_is_scalar(it) for it in items):
            for i, it in enumerate(items):
                children.append(_field_node(f"{path}[{i}]", f"#{i + 1}", it, resource, field_src))
        else:
            for i, it in enumerate(items):
                item_path = f"{path}[{i}]"
                if _is_scalar(it):
                    children.append(_field_node(item_path, f"#{i + 1}", it, resource, field_src))
                else:
                    children.append(
                        {
                            "type": "group",
                            "title": f"{_label(key)} #{i + 1}",
                            "children": _build_nodes(it, resource, item_path, field_src),
                        }
                    )
        return {"type": "group", "title": _label(key), "children": children}

    if isinstance(value, dict):
        children = _build_nodes(value, resource, path, field_src)
        if not children:
            return None
        return {"type": "group", "title": _label(key), "children": children}

    return None


def _unwrap(raw: Any) -> Any:
    return raw["Data"] if isinstance(raw, dict) and "Data" in raw else raw


def load_bestrx() -> tuple[dict[str, Any] | None, str | None]:
    """Returns ({'sections': [...], 'field_src': {...}}, None) or (None, error)."""
    field_src: dict[str, dict[str, str]] = {}
    sections: list[dict[str, Any]] = []
    missing: list[str] = []

    # Patient Information
    if PATIENT_FILE.is_file():
        try:
            patient = _unwrap(json.loads(PATIENT_FILE.read_text(encoding="utf-8")))
        except (OSError, json.JSONDecodeError) as exc:
            return None, f"Could not read {PATIENT_FILE.name}: {exc}"
        sections.append(
            {
                "id": "patient",
                "title": "Patient Information",
                "nodes": _build_nodes(patient, "patient", "patient", field_src),
            }
        )
    else:
        missing.append(PATIENT_FILE.name)

    # Drug Information — each drug becomes its own sub-card
    if DRUG_FILE.is_file():
        try:
            drug_data = _unwrap(json.loads(DRUG_FILE.read_text(encoding="utf-8")))
        except (OSError, json.JSONDecodeError) as exc:
            return None, f"Could not read {DRUG_FILE.name}: {exc}"
        drug_list = (drug_data or {}).get("Drug") or []
        drug_nodes: list[dict] = []
        for i, drug in enumerate(drug_list):
            drug_nodes.append(
                {
                    "type": "group",
                    "title": f"Drug #{i + 1}",
                    "children": _build_nodes(drug, "drug", f"drug.Drug[{i}]", field_src),
                }
            )
        sections.append({"id": "drug", "title": "Drug Information", "nodes": drug_nodes})
    else:
        missing.append(DRUG_FILE.name)

    err = None
    if missing:
        err = f"Missing BestRx sample file(s): {', '.join(missing)} (expected in {_BESTRX_DIR})."
    return {"sections": sections, "field_src": field_src}, err
