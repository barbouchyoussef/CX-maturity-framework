from fastapi import APIRouter, HTTPException
from schemas.dimension import (
    DimensionCreate,
    DimensionCreateResponse,
    DimensionOut,
    DimensionUpdate,
)
from repositories.dimension_repository import (
    create_dimension,
    delete_dimension,
    get_all_dimensions,
    get_dimension_by_id,
    get_dimensions_by_sector,
    toggle_dimension_status,
    update_dimension,
)

router = APIRouter(prefix="/dimensions", tags=["dimensions"])


@router.get("", response_model=list[DimensionOut])
def get_dimensions_route(sector_id: int | None = None):
    try:
        if sector_id is not None:
            return get_dimensions_by_sector(sector_id)
        return get_all_dimensions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{dimension_id}", response_model=DimensionOut)
def get_dimension_route(dimension_id: int):
    try:
        dimension = get_dimension_by_id(dimension_id)
        if not dimension:
            raise HTTPException(status_code=404, detail="Dimension not found")
        return dimension
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=DimensionCreateResponse)
def create_dimension_route(payload: DimensionCreate):
    try:
        dimension_id = create_dimension(
            sector_id=payload.sector_id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            weight=payload.weight,
            display_order=payload.display_order,
            is_active=payload.is_active,
        )
        return DimensionCreateResponse(
            dimension_id=dimension_id,
            message="Dimension created successfully",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{dimension_id}")
def update_dimension_route(dimension_id: int, payload: DimensionUpdate):
    try:
        updated = update_dimension(
            dimension_id=dimension_id,
            sector_id=payload.sector_id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            weight=payload.weight,
            display_order=payload.display_order,
            is_active=payload.is_active,
        )

        if not updated:
            raise HTTPException(status_code=404, detail="Dimension not found")

        return {"message": "Dimension updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{dimension_id}/toggle")
def toggle_dimension_route(dimension_id: int):
    try:
        updated = toggle_dimension_status(dimension_id)

        if not updated:
            raise HTTPException(status_code=404, detail="Dimension not found")

        return {"message": "Dimension status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{dimension_id}")
def delete_dimension_route(dimension_id: int):
    try:
        deleted = delete_dimension(dimension_id)

        if not deleted:
            raise HTTPException(status_code=404, detail="Dimension not found")

        return {"message": "Dimension deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))