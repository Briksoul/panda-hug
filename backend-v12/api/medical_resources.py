"""Deterministic clinician and support-resource directory."""
from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from auth import get_current_user
from database import MedicalResource, User, get_db, session_scope


router = APIRouter(prefix="/medical-resources")
RESOURCE_FILE = (
    Path(__file__).resolve().parent.parent
    / "resources"
    / "medical_resources.json"
)


def _payload() -> dict:
    return json.loads(RESOURCE_FILE.read_text(encoding="utf-8"))


def init_medical_resources() -> None:
    payload = _payload()
    with session_scope() as database:
        for item in payload.get("resources", []):
            record = database.get(MedicalResource, item["id"])
            if record is None:
                record = MedicalResource(id=item["id"])
                database.add(record)
            for key in (
                "resource_type",
                "country",
                "region",
                "region_zh",
                "name",
                "organization",
                "phones",
                "emails",
                "websites",
                "other_contacts",
                "address",
                "schedule",
                "specialties",
                "source_url",
                "verification_status",
            ):
                default = [] if key in {
                    "phones",
                    "emails",
                    "websites",
                    "other_contacts",
                    "specialties",
                } else ""
                setattr(record, key, item.get(key, default))


def serialize_medical_resource(resource: MedicalResource) -> dict:
    return {
        "id": resource.id,
        "resource_type": resource.resource_type,
        "country": resource.country,
        "region": resource.region,
        "region_zh": resource.region_zh,
        "name": resource.name,
        "organization": resource.organization,
        "phones": resource.phones or [],
        "emails": resource.emails or [],
        "websites": resource.websites or [],
        "other_contacts": resource.other_contacts or [],
        "address": resource.address,
        "schedule": resource.schedule,
        "specialties": resource.specialties or [],
        "source_url": resource.source_url,
        "verification_status": resource.verification_status,
    }


def search_medical_resources(
    database: Session,
    country: str = "",
    region: str = "",
    query_text: str = "",
    limit: int = 20,
) -> list[dict]:
    query = select(MedicalResource)
    if country:
        query = query.where(MedicalResource.country == country.upper())
    if region:
        query = query.where(or_(
            MedicalResource.region.ilike(region),
            MedicalResource.region_zh.ilike(region),
        ))
    records = database.scalars(
        query.order_by(
            MedicalResource.region.asc(),
            MedicalResource.resource_type.asc(),
            MedicalResource.name.asc(),
        )
    ).all()
    normalized_query = query_text.strip().casefold()
    if normalized_query:
        records = [
            record for record in records
            if normalized_query in " ".join([
                record.name,
                record.organization,
                record.region,
                record.region_zh,
                " ".join(record.specialties or []),
            ]).casefold()
        ]
    return [
        serialize_medical_resource(record)
        for record in records[:limit]
    ]


@router.get("")
def list_medical_resources(
    country: str = Query(default="", max_length=8),
    region: str = Query(default="", max_length=100),
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=20, ge=1, le=50),
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    payload = _payload()
    return {
        "resources": search_medical_resources(
            database,
            country=country,
            region=region,
            query_text=q,
            limit=limit,
        ),
        "disclaimer": (
            payload["disclaimer_en"]
            if user.language == "en"
            else payload["disclaimer_zh"]
        ),
    }


@router.get("/regions")
def list_medical_regions(
    country: str = Query(default="", max_length=8),
    _user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    query = select(
        MedicalResource.country,
        MedicalResource.region,
        MedicalResource.region_zh,
    ).distinct()
    if country:
        query = query.where(MedicalResource.country == country.upper())
    rows = database.execute(
        query.order_by(
            MedicalResource.country.asc(),
            MedicalResource.region.asc(),
        )
    ).all()
    return {
        "regions": [
            {
                "country": row.country,
                "region": row.region,
                "region_zh": row.region_zh,
            }
            for row in rows
            if row.region
        ]
    }
