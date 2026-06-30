"""Prior-auth workspace fields — shared list and master-view match stats."""

from __future__ import annotations

from typing import Any

from exports import MASTER_SLOT, load_ehr_from_export

# Fields absent from sample data but obtainable from a known FHIR resource (yellow tick).
GETTABLE_FIELDS: dict[str, dict[str, dict[str, str]]] = {
    "epic": {
        "member_id": {"resource": "Coverage", "path": "Coverage.subscriberId"},
        "provider_phone": {"resource": "PractitionerRole / Location", "path": "telecom"},
        "provider_fax": {"resource": "PractitionerRole / Location", "path": "telecom (fax)"},
        "clinical_notes": {"resource": "DocumentReference", "path": "(document)"},
    },
    "nextgen": {
        "member_id": {"resource": "Coverage", "path": "Coverage.subscriberId"},
        "days_of_supply": {
            "resource": "MedicationRequest",
            "path": "extractable (not explicitly populated)",
        },
    },
    "iknowmed": {
        "member_id": {"resource": "Coverage", "path": "Coverage.subscriberId"},
        "npi": {"resource": "Practitioner", "path": "identifier.value"},
        "provider_phone": {"resource": "PractitionerRole / Location", "path": "telecom"},
    },
}

# Unique PA fields shown in workspace.html (drug_name appears twice in the form).
WORKSPACE_PA_FIELDS: tuple[str, ...] = (
    "drug_name",
    "first_name",
    "middle_name",
    "last_name",
    "gender",
    "date_of_birth",
    "member_id",
    "patient_mrn_provider",
    "address_line_1",
    "address_line_2",
    "city",
    "state",
    "zip_code",
    "phone_number",
    "dosing_schedule",
    "quantity",
    "dosing_form",
    "days_of_supply",
    "primary_icd_code",
    "primary_description",
    "secondary_icd_code",
    "secondary_diagnosis",
    "npi",
    "date_of_service",
    "provider_first_name",
    "provider_last_name",
    "provider_address_line",
    "provider_city",
    "provider_state",
    "provider_zip",
    "provider_phone",
    "provider_fax",
    "clinical_notes",
    "lab_reports",
    "is_substitution_allowed",
    "prescription_generic",
    "drug_instructions",
    "dispense_amount",
)


def _field_value(field_id: str, flat: dict[str, Any]) -> Any:
    if field_id == "primary_description":
        return flat.get("primary_description") or flat.get("primary_diagnosis")
    return flat.get(field_id)


def _field_found(field_id: str, flat: dict[str, Any]) -> bool:
    val = _field_value(field_id, flat)
    return val is not None and str(val).strip() != ""


def field_status(field_id: str, flat: dict[str, Any], gettable: dict[str, dict[str, str]]) -> str:
    """Mirror workspace.html prov_input: ok | maybe | no."""
    if _field_found(field_id, flat):
        return "ok"
    if field_id in gettable:
        return "maybe"
    return "no"


def compute_master_field_match(
    ehr: str, gettable: dict[str, dict[str, str]] | None = None
) -> dict[str, int] | None:
    """Green-field match rate for the EHR master export (ok / total PA fields)."""
    payload, err = load_ehr_from_export(ehr.lower(), MASTER_SLOT)
    if err or not payload:
        return None
    flat = (payload or {}).get("flat") or {}
    gettable = gettable or {}
    matched = sum(
        1 for fid in WORKSPACE_PA_FIELDS if field_status(fid, flat, gettable) == "ok"
    )
    total = len(WORKSPACE_PA_FIELDS)
    return {
        "matched": matched,
        "total": total,
        "percent": round(matched * 100 / total) if total else 0,
    }
