from fastapi import APIRouter, HTTPException
from schemas.sector import (
    SectorCreate,
    SectorCreateResponse,
    SectorOut,
    SectorUpdate,
)
from repositories.sector_repository import (
    create_sector,
    delete_sector,
    get_all_sectors,
    get_sector_by_id,
    toggle_sector_status,
    update_sector,
)

router = APIRouter(prefix="/sectors", tags=["sectors"])


@router.get("", response_model=list[SectorOut])
def get_sectors_route():
    try:
        return get_all_sectors()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{sector_id}", response_model=SectorOut)
def get_sector_route(sector_id: int):
    try:
        sector = get_sector_by_id(sector_id)
        if not sector:
            raise HTTPException(status_code=404, detail="Sector not found")
        return sector
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=SectorCreateResponse)
def create_sector_route(payload: SectorCreate):
    try:
        sector_id = create_sector(
            name=payload.name,
            code=payload.code,
            description=payload.description,
            display_order=payload.display_order,
            is_active=payload.is_active,
        )
        return SectorCreateResponse(
            sector_id=sector_id,
            message="Sector created successfully",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{sector_id}")
def update_sector_route(sector_id: int, payload: SectorUpdate):
    try:
        updated = update_sector(
            sector_id=sector_id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            display_order=payload.display_order,
            is_active=payload.is_active,
        )

        if not updated:
            raise HTTPException(status_code=404, detail="Sector not found")

        return {"message": "Sector updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{sector_id}/toggle")
def toggle_sector_route(sector_id: int):
    try:
        updated = toggle_sector_status(sector_id)

        if not updated:
            raise HTTPException(status_code=404, detail="Sector not found")

        return {"message": "Sector status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{sector_id}")   
def delete_sector_route(sector_id: int):
    try:
        deleted = delete_sector(sector_id)

        if not deleted:
            raise HTTPException(status_code=404, detail="Sector not found")

        return {"message": "Sector deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))