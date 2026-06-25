"""
Unified EHR sandbox dashboard — reads static FHIR per-user exports (fhir_*_output_<n>.json).
"""

from __future__ import annotations

import os
import secrets

from flask import Flask, jsonify, redirect, render_template, request, send_file, session, url_for

from bestrx import list_bestrx_previews, load_bestrx
from exports import list_test_user_previews, load_ehr_from_export
from platform_guide import build_platform, resolve_download_path

app = Flask(__name__)
app.secret_key = os.environ.get("DASHBOARD_FLASK_SECRET", secrets.token_hex(32))

EHRS = ("epic", "ecw", "nextgen", "iknowmed")

# Pharmacy management platforms (non-FHIR; loaded via bestrx.py).
PHARMACY_SYSTEMS = ("bestrx",)

# Centralized display names for every system shown in the UI.
DISPLAY_NAMES: dict[str, str] = {
    "epic": "Epic",
    "ecw": "eClinicalWorks",
    "nextgen": "NextGen",
    "iknowmed": "iKnowMed",
    "bestrx": "BestRx",
}


def display_name(system_id: str) -> str:
    return DISPLAY_NAMES.get(system_id, system_id)

# Fields absent from the sample data but obtainable from a known FHIR resource.
# Shown as a yellow tick (instead of red cross) in the master view only, and the
# info card surfaces the {resource, path} where the value can be sourced.
GETTABLE_FIELDS: dict[str, dict[str, dict[str, str]]] = {
    "epic": {
        "member_id": {"resource": "Coverage", "path": "Coverage.subscriberId"},
        "provider_phone": {"resource": "PractitionerRole / Location", "path": "telecom"},
        "provider_fax": {"resource": "PractitionerRole / Location", "path": "telecom (fax)"},
        "clinical_notes": {"resource": "DocumentReference", "path": "(document)"},
    },
    "nextgen": {
        "member_id": {"resource": "Coverage", "path": "Coverage.subscriberId"},
        "days_of_supply": {"resource": "MedicationRequest", "path": "extractable (not explicitly populated)"},
    },
    "iknowmed": {
        "member_id": {"resource": "Coverage", "path": "Coverage.subscriberId"},
        "npi": {"resource": "Practitioner", "path": "identifier.value"},
        "provider_phone": {"resource": "PractitionerRole / Location", "path": "telecom"},
    },
}


def _cmm_key() -> str:
    return session.get("cmm_key") or "".join(
        secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(8)
    )


def _summary_line(flat: dict) -> str:
    parts = [
        f"{flat.get('first_name', '')} {flat.get('last_name', '')}".strip(),
        flat.get("patient_mrn_provider") or flat.get("member_id"),
        flat.get("date_of_birth"),
    ]
    if flat.get("age_years"):
        parts.append(f"({flat['age_years']}yrs)")
    if flat.get("drug_name"):
        parts.append(flat["drug_name"])
    return " • ".join(str(p) for p in parts if p)


def _parse_slot_arg() -> str | None:
    """Raw slot arg: int-like string or 'master'. Loader normalizes it."""
    raw = request.args.get("slot")
    if raw is None or raw == "":
        return None
    return raw


def _ehr_card(system_id: str) -> dict:
    return {
        "id": system_id,
        "name": display_name(system_id),
        "href": url_for("workspace", ehr=system_id),
        "logo": url_for("static", filename=f"logos/{system_id}.png"),
        "previews": list_test_user_previews(system_id),
    }


def _pharmacy_card(system_id: str) -> dict:
    return {
        "id": system_id,
        "name": display_name(system_id),
        "href": url_for("pharmacy", system=system_id),
        "logo": url_for("static", filename=f"logos/{system_id}.png"),
        "previews": list_bestrx_previews() if system_id == "bestrx" else [],
    }


def _guide_categories() -> list[dict]:
    return [
        {
            "name": "Electronic Health Record (EHR)",
            "platforms": [build_platform(e, display_name(e), "ehr") for e in EHRS],
        },
        {
            "name": "Pharmacy Management Systems",
            "platforms": [
                build_platform(p, display_name(p), "pharmacy") for p in PHARMACY_SYSTEMS
            ],
        },
    ]


@app.route("/")
def home():
    categories = [
        {
            "name": "Electronic Health Record (EHR)",
            "systems": [_ehr_card(e) for e in EHRS],
        },
        {
            "name": "Pharmacy Management Systems",
            "systems": [_pharmacy_card(p) for p in PHARMACY_SYSTEMS],
        },
    ]
    return render_template("home.html", categories=categories, active_tab="atlas")


@app.route("/guide")
def platform_guide():
    return render_template(
        "platform_guide.html",
        categories=_guide_categories(),
        active_tab="guide",
    )


@app.route("/download/<system_id>/<slot>")
def download_export(system_id: str, slot: str):
    path = resolve_download_path(system_id, slot)
    if not path or not path.is_file():
        return "Export not found", 404
    return send_file(
        path,
        mimetype="application/json",
        as_attachment=True,
        download_name=path.name,
    )


@app.route("/workspace")
def workspace():
    ehr = (request.args.get("ehr") or session.get("active_ehr") or "epic").lower()
    if ehr not in EHRS:
        ehr = "epic"
    session["active_ehr"] = ehr

    slot = _parse_slot_arg()
    payload, err = load_ehr_from_export(ehr, slot)
    flat = (payload or {}).get("flat") or {}
    field_src = (payload or {}).get("field_src") or {}
    is_master = bool((payload or {}).get("is_master"))
    gettable = GETTABLE_FIELDS.get(ehr, {})

    # In the master view, surface the source resource/path for obtainable
    # (yellow) fields in the info card when the value is empty.
    if is_master and gettable:
        field_src = dict(field_src)
        for fid, src in gettable.items():
            val = flat.get(fid)
            if val is None or str(val).strip() == "":
                field_src[fid] = {"resource": src["resource"], "path": src["path"]}

    user_options = list_test_user_previews(ehr)
    current_slot = (payload or {}).get("slot")
    if current_slot is None and user_options:
        current_slot = user_options[0]["slot"]

    return render_template(
        "workspace.html",
        ehr=ehr,
        ehrs=EHRS,
        flat=flat,
        field_src=field_src,
        error=err,
        user_options=user_options,
        current_slot=current_slot,
        is_master=is_master,
        gettable=gettable,
    )


@app.route("/pharmacy")
def pharmacy():
    system = (request.args.get("system") or "bestrx").lower()
    if system not in PHARMACY_SYSTEMS:
        return redirect(url_for("home"))

    data, err = load_bestrx()
    return render_template(
        "bestrx.html",
        system=system,
        title=display_name(system),
        sections=(data or {}).get("sections") or [],
        field_src=(data or {}).get("field_src") or {},
        error=err,
        user_options=list_bestrx_previews(),
    )


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/api/context")
def api_context():
    ehr = (request.args.get("ehr") or session.get("active_ehr") or "epic").lower()
    session["active_ehr"] = ehr
    slot = _parse_slot_arg()
    payload, err = load_ehr_from_export(ehr, slot)
    return jsonify(
        {
            "ehr": ehr,
            "error": err,
            "slot": (payload or {}).get("slot"),
            "available_slots": (payload or {}).get("available_slots") or [],
            "flat": (payload or {}).get("flat") or {},
            "field_src": (payload or {}).get("field_src") or {},
            "patient_id": (payload or {}).get("patient_id"),
            "summary": _summary_line((payload or {}).get("flat") or {}),
            "cmm_key": _cmm_key(),
        }
    )


@app.route("/logout-session")
def logout_session():
    session.clear()
    return redirect(url_for("home"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5050")), debug=True)
