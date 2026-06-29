"""Platform Guide content — metadata, endpoints from exports, test patients, downloads."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from bestrx import PATIENT_FILE, DRUG_FILE
from exports import (
    MASTER_SLOT,
    list_output_slots,
    list_test_user_previews,
    master_export_path,
    peek_user_gender,
    peek_user_preview,
    slot_export_path,
)

_DIR = Path(__file__).resolve().parent

# Curated copy + official FHIR / developer doc links (no credentials).
_PLATFORM_COPY: dict[str, dict[str, Any]] = {
    "epic": {
        "what_it_is": (
            "Epic is a leading ambulatory and inpatient EHR. In this atlas we use "
            "Epic on FHIR R4 sandbox exports for prior-authorization field mapping."
        ),
        "fhir_links": [
            {"label": "Epic on FHIR — Documentation", "url": "https://fhir.epic.com/Documentation"},
            {"label": "FHIR R4 specifications", "url": "https://fhir.epic.com/Specifications"},
            {"label": "Open Epic — R4 endpoints", "url": "https://open.epic.com/Endpoints/R4"},
            {"label": "Open Epic — Developer portal", "url": "https://open.epic.com/"},
            {"label": "FHIR R4 specification (HL7)", "url": "https://hl7.org/fhir/R4/"},
        ],
        "is_fhir": True,
        "research_links": [
            {
                "label": "Sandbox Outputs — Notion research",
                "url": "https://app.notion.com/p/Sandbox-Outputs-366e5f5a1a628032bd73d11d2f4558d3",
            },
        ],
        "test_patient_resources": [
            {
                "label": "Epic sandbox test patients",
                "url": "https://fhir.epic.com/Documentation?docId=testpatients",
            },
        ],
    },
    "ecw": {
        "what_it_is": (
            "eClinicalWorks (eCW) exposes patient data via SMART on FHIR. Exports "
            "here come from the eCW staging FHIR server used for integration testing."
        ),
        "fhir_links": [
            {"label": "eCW FHIR portal", "url": "https://fhir.eclinicalworks.com/"},
            {
                "label": "eCW Open Developer — API documentation",
                "url": "https://fhir.eclinicalworks.com/ecwopendev/documentation",
            },
            {"label": "SMART App Launch", "url": "https://hl7.org/fhir/smart-app-launch/"},
        ],
        "is_fhir": True,
        "research_links": [
            {
                "label": "eClinical Works Sandbox — Notion research",
                "url": "https://app.notion.com/p/eClinical-Works-Sandbox-36de5f5a1a6280318b06ef3fb51f9493",
            },
        ],
    },
    "nextgen": {
        "what_it_is": (
            "NextGen Healthcare provides FHIR R4 APIs through its interoperability "
            "platform. Samples here support PA workflow demos against NextGen-shaped data."
        ),
        "fhir_links": [
            {"label": "NextGen Developer Portal", "url": "https://developer.nextgen.com/"},
            {
                "label": "NextGen Office FHIR R4 Patient Access API — Developer Guide (PDF)",
                "url": "https://www.nextgen.com/-/media/files/ngo/NextGen-Office-FHIR-R4-Patient-Access-API-Developer-Guide",
            },
        ],
        "is_fhir": True,
        "research_links": [
            {
                "label": "NextGen Sandbox Integration — Notion research",
                "url": "https://app.notion.com/p/Nextgen-Sandbox-Integration-373e5f5a1a6280ebb98eecdb2ddce524",
            },
        ],
        "test_patient_credentials": [
            {
                "patient_id": "HF428946492",
                "name": "Smith, David",
                "username": "DavidFHIRa",
                "password": "password",
            },
            {
                "patient_id": "HF428946523",
                "name": "Smith, Anna",
                "username": "TestAnna",
                "password": "TestAnna",
            },
        ],
    },
    "iknowmed": {
        "what_it_is": (
            "iKnowMed (Ontada) oncology EHR with FHIR access for clinical and "
            "medication data used in specialty prior-authorization scenarios."
        ),
        "fhir_links": [
            {
                "label": "Ontada developer portal — login",
                "url": "https://developer-portal.ontada.com/",
            },
        ],
        "is_fhir": True,
        "research_links": [
            {
                "label": "iKnowMed (IKM) — Notion research",
                "url": "https://app.notion.com/p/iKnowMed-IKM-372e5f5a1a6280298507f834c2900f53",
            },
        ],
    },
    "bestrx": {
        "what_it_is": (
            "BestRx is a pharmacy management system (non-FHIR). Sample REST-style "
            "patient and drug responses are flattened in the atlas for comparison with EHR data."
        ),
        "fhir_links": [
            {"label": "BestRx — product overview", "url": "https://www.bestrx.com/"},
            {"label": "BestRx Connect — API documentation", "url": "https://apidocs.bestrxconnect.com/"},
        ],
        "sample_output_links": [
            {
                "label": "Patient API — Get Patient",
                "url": "https://apidocs.bestrxconnect.com/patient-api/overview",
                "file": "patient_get_patient.json",
            },
            {
                "label": "Drug API — Get Drug Information",
                "url": "https://apidocs.bestrxconnect.com/api-5031314",
                "file": "drug_get_drug_information.json",
            },
        ],
        "is_fhir": False,
        "show_sandbox_endpoints": False,
    },
}

# Canonical sandbox endpoints (override export-derived values when present).
_CURATED_SANDBOX_ENDPOINTS: dict[str, list[dict[str, str]]] = {
    "epic": [
        {
            "label": "FHIR base URL",
            "url": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
        },
        {
            "label": "OAuth authorize",
            "url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize",
        },
        {
            "label": "OAuth token",
            "url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
        },
        {
            "label": "CapabilityStatement / metadata",
            "url": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/metadata",
        },
        {
            "label": "SMART configuration",
            "url": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/.well-known/smart-configuration",
        },
    ],
    "ecw": [
        {
            "label": "FHIR base URL",
            "url": "https://staging-fhir.ecwcloud.com/fhir/r4/FFBJCD",
        },
        {
            "label": "OAuth authorize",
            "url": "https://staging-oauthserver.ecwcloud.com/oauth/oauth2/authorize",
        },
        {
            "label": "OAuth token",
            "url": "https://staging-oauthserver.ecwcloud.com/oauth/oauth2/token",
        },
        {
            "label": "CapabilityStatement / metadata",
            "url": "https://staging-fhir.ecwcloud.com/fhir/r4/FFBJCD/metadata",
        },
        {
            "label": "SMART configuration",
            "url": "https://staging-fhir.ecwcloud.com/fhir/r4/FFBJCD/.well-known/smart-configuration",
        },
    ],
    "nextgen": [
        {
            "label": "FHIR base URL / AUD",
            "url": "https://fhir.meditouchehr.com/api/fhir/r4",
        },
        {
            "label": "FHIR metadata (sandbox / Meditouch)",
            "url": "https://fhir.meditouchehr.com/api/fhir/r4/metadata",
        },
        {
            "label": "FHIR metadata (prod-style endpoint)",
            "url": "https://prod-fhir.prod.ngo.nextgenaws.net/api/fhir/r4/metadata",
        },
        {
            "label": "SMART configuration",
            "url": "https://prod-fhir.prod.ngo.nextgenaws.net/api/fhir/r4/.well-known/smart-configuration",
        },
        {
            "label": "OAuth authorize",
            "url": "https://idp-prod.prod.ngo.nextgenaws.net/auth/realms/nextgen/protocol/openid-connect/auth",
        },
        {
            "label": "OAuth authorize (with AUD)",
            "url": "https://idp-prod.prod.ngo.nextgenaws.net/auth/realms/nextgen/protocol/openid-connect/auth?aud=https://fhir.meditouchehr.com/api/fhir/r4",
        },
        {
            "label": "OAuth token",
            "url": "https://idp-prod.prod.ngo.nextgenaws.net/auth/realms/nextgen/protocol/openid-connect/token",
        },
        {
            "label": "Token introspection",
            "url": "https://idp-prod.prod.ngo.nextgenaws.net/auth/realms/nextgen/protocol/openid-connect/token/introspect",
        },
        {
            "label": "Token revocation",
            "url": "https://idp-prod.prod.ngo.nextgenaws.net/auth/realms/nextgen/protocol/openid-connect/revoke",
        },
    ],
    "iknowmed": [
        {
            "label": "FHIR base URL (non-prod)",
            "url": "https://interopio.ontada.com/gateway/fhir/developerportalio/portal/gw-fhir",
        },
        {
            "label": "CapabilityStatement / metadata",
            "url": "https://interopio.ontada.com/gateway/fhir/developerportalio/portal/gw-fhir/metadata",
        },
        {
            "label": "SMART configuration",
            "url": "https://interopio.ontada.com/gateway/fhir/developerportalio/portal/gw-fhir/.well-known/smart-configuration",
        },
    ],
}

# Endpoint keys shown in the guide (order preserved). Values pulled from export JSON.
_ENDPOINT_KEYS: tuple[tuple[str, str], ...] = (
    ("fhir_base_url", "FHIR base URL"),
    ("fhir_base", "FHIR base URL"),
    ("iss_raw", "Issuer (ISS)"),
    ("metadata_url", "CapabilityStatement / metadata"),
    ("smart_configuration_url", "SMART configuration"),
    ("authorization_endpoint", "OAuth authorize"),
    ("token_endpoint", "OAuth token"),
)

# Omit dev-only or sensitive-adjacent fields from the guide UI.
_ENDPOINT_SKIP = frozenset({"redirect_uri", "emr_launch_url_registered", "client_id"})


def _guide_url_ok(url: str) -> bool:
    """Drop stale dev tunnel URLs (e.g. ngrok) from the guide."""
    return "ngrok" not in url.lower()


def _fmt_ts(raw: str | None) -> str:
    if not raw:
        return "—"
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M UTC")
    except ValueError:
        return str(raw)[:19]


def _load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _patient_fhir_link(raw: dict[str, Any]) -> str | None:
    """Browsable link only when export stores an explicit patient_resource_url (e.g. eCW).

    Do not auto-build FHIR base + /Patient/{id} links — Epic and other vendors
  require OAuth; opening those URLs in a browser returns 403.
    """
    urls = raw.get("urls") if isinstance(raw.get("urls"), dict) else {}
    href = urls.get("patient_resource_url")
    if href and _guide_url_ok(str(href)):
        return str(href)
    return None


def _patient_fhir_api_ref(raw: dict[str, Any]) -> str | None:
    """Full FHIR Patient API path for display (not a working browser link)."""
    urls = raw.get("urls") if isinstance(raw.get("urls"), dict) else {}
    base = urls.get("fhir_base_url") or raw.get("fhir_base")
    pid = raw.get("patient_id") or (raw.get("patient_summary") or {}).get("id")
    if base and pid:
        return f"{str(base).rstrip('/')}/Patient/{pid}"
    return None


def _endpoints_for_system(system_id: str) -> list[dict[str, str]]:
    """Best available technical endpoints from master or first slot export."""
    system_id = system_id.lower()
    if system_id == "bestrx":
        return []
    candidates: list[Path] = []
    mp = master_export_path(system_id)
    if mp.is_file():
        candidates.append(mp)
    for slot in list_output_slots(system_id):
        candidates.append(slot_export_path(system_id, slot))
    if not candidates:
        return []

    merged: dict[str, str] = {}
    oauth_scope: str | None = None
    for path in candidates:
        raw = _load_json(path)
        urls = raw.get("urls") if isinstance(raw.get("urls"), dict) else {}
        for key, label in _ENDPOINT_KEYS:
            if key in _ENDPOINT_SKIP:
                continue
            val = urls.get(key) if key in urls else raw.get(key)
            if val and key not in merged and _guide_url_ok(str(val)):
                merged[key] = str(val)
        if not oauth_scope and raw.get("oauth_scope"):
            oauth_scope = str(raw["oauth_scope"])

    rows: list[dict[str, str]] = []
    seen_urls: set[str] = set()
    for key, label in _ENDPOINT_KEYS:
        val = merged.get(key)
        if not val or val in seen_urls or not _guide_url_ok(val):
            continue
        seen_urls.add(val)
        rows.append({"label": label, "url": val})
    if oauth_scope:
        rows.append({"label": "OAuth scopes (export)", "url": oauth_scope, "is_text": True})

    base = merged.get("fhir_base_url") or merged.get("fhir_base")
    if base:
        base = str(base).rstrip("/")
        derived = [
            ("metadata_url", f"{base}/metadata", "CapabilityStatement / metadata"),
            ("smart_configuration_url", f"{base}/.well-known/smart-configuration", "SMART configuration"),
        ]
        seen = {r["url"] for r in rows if not r.get("is_text")}
        for _key, url, label in derived:
            if url not in seen and _guide_url_ok(url):
                rows.append({"label": label, "url": url})
                seen.add(url)

    curated = _CURATED_SANDBOX_ENDPOINTS.get(system_id)
    if curated:
        rows = [r for r in curated if _guide_url_ok(r["url"])]
        if oauth_scope:
            rows.append({"label": "OAuth scopes (export)", "url": oauth_scope, "is_text": True})
    return rows


def _export_path(system_id: str, slot: str | int) -> Path | None:
    system_id = system_id.lower()
    if str(slot) == MASTER_SLOT:
        p = master_export_path(system_id)
        return p if p.is_file() else None
    if system_id == "bestrx":
        return None
    try:
        p = slot_export_path(system_id, int(slot))
        return p if p.is_file() else None
    except (TypeError, ValueError):
        return None


def _downloads_for_system(system_id: str) -> list[dict[str, Any]]:
    system_id = system_id.lower()
    rows: list[dict[str, Any]] = []
    if system_id == "bestrx":
        for label, path, fname in (
            ("Master — patient sample", PATIENT_FILE, "patient_get_patient.json"),
            ("Master — drug sample", DRUG_FILE, "drug_get_drug_information.json"),
        ):
            if path.is_file():
                row = {
                    "type_label": label,
                    "filename": fname,
                    "exported_at": "—",
                    "download_name": fname,
                }
                row["slot_key"] = download_slot_key(row, system_id)
                rows.append(row)
        return rows

    previews = list_test_user_previews(system_id)
    for p in previews:
        slot = p["slot"]
        path = _export_path(system_id, slot)
        if not path:
            continue
        raw = _load_json(path)
        ts = _fmt_ts(raw.get("exported_at") or raw.get("saved_at"))
        if slot == MASTER_SLOT:
            type_label = "Master"
        else:
            type_label = f"Test user {slot}"
        row = {
            "type_label": type_label,
            "filename": path.name,
            "exported_at": ts,
            "download_name": path.name,
        }
        row["slot_key"] = download_slot_key(row, system_id)
        rows.append(row)
    return rows


def _test_patients_for_system(system_id: str) -> list[dict[str, Any]]:
    system_id = system_id.lower()
    if system_id == "bestrx":
        return []

    out: list[dict[str, Any]] = []
    previews = list_test_user_previews(system_id)
    for p in previews:
        if p.get("is_master"):
            continue
        slot = p["slot"]
        path = slot_export_path(system_id, int(slot))
        raw = _load_json(path)
        label, detail = peek_user_preview(path, system_id)
        gender = peek_user_gender(path, system_id)
        link = _patient_fhir_link(raw)
        fhir_api_ref = _patient_fhir_api_ref(raw) if not link else None
        pid = raw.get("patient_id") or (raw.get("patient_summary") or {}).get("id") or ""
        entry: dict[str, Any] = {
            "slot": slot,
            "label": label,
            "patient_id": str(pid) if pid else "",
            "dob": detail or (raw.get("patient_summary") or {}).get("birthDate") or "",
            "gender": gender,
            "link": link,
            "fhir_api_ref": fhir_api_ref,
        }
        out.append(entry)
    return out


def build_platform(system_id: str, display_name: str, category: str) -> dict[str, Any]:
    copy = _PLATFORM_COPY.get(system_id.lower(), {})
    return {
        "id": system_id,
        "name": display_name,
        "category": category,
        "logo": f"logos/{system_id}.png",
        "what_it_is": copy.get("what_it_is", ""),
        "fhir_links": copy.get("fhir_links") or [],
        "is_fhir": copy.get("is_fhir", True),
        "endpoints": _endpoints_for_system(system_id),
        "test_patients": _test_patients_for_system(system_id),
        "test_patient_resources": copy.get("test_patient_resources") or [],
        "test_patient_credentials": copy.get("test_patient_credentials") or [],
        "sample_output_links": copy.get("sample_output_links") or [],
        "research_links": copy.get("research_links") or [],
        "show_sandbox_endpoints": copy.get("show_sandbox_endpoints", True),
        "downloads": _downloads_for_system(system_id),
    }


def resolve_download_path(system_id: str, slot: str) -> Path | None:
    """Map URL segment to on-disk JSON for send_file."""
    system_id = system_id.lower()
    if system_id == "bestrx":
        if slot == "patient":
            return PATIENT_FILE if PATIENT_FILE.is_file() else None
        if slot == "drug":
            return DRUG_FILE if DRUG_FILE.is_file() else None
        return None
    return _export_path(system_id, slot)


def download_slot_key(row: dict[str, Any], system_id: str) -> str:
    """Stable download route key for a downloads-table row."""
    system_id = system_id.lower()
    if system_id == "bestrx":
        if "patient" in row.get("type_label", "").lower():
            return "patient"
        if "drug" in row.get("type_label", "").lower():
            return "drug"
    label = row.get("type_label", "")
    if label == "Master":
        return MASTER_SLOT
    if label.startswith("Test user "):
        return label.replace("Test user ", "").strip()
    return row.get("filename", "file")
