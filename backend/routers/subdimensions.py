from fastapi import APIRouter, HTTPException
from schemas.subdimension import (
    SubdimensionCreate,
    SubdimensionCreateResponse,
    SubdimensionOut,
    SubdimensionUpdate,
)
from repositories.subdimension_repository import (
    create_subdimension,
    delete_subdimension,
    get_all_subdimensions,
    get_subdimension_by_id,
    get_subdimensions_by_dimension,
    toggle_subdimension_status,
    update_subdimension,
)

router = APIRouter(prefix="/subdimensions", tags=["subdimensions"])


@router.get("", response_model=list[SubdimensionOut])
def get_subdimensions_route(dimension_id: int | None = None):
    try:
        if dimension_id is not None:
            return get_subdimensions_by_dimension(dimension_id)
        return get_all_subdimensions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{subdimension_id}", response_model=SubdimensionOut)
def get_subdimension_route(subdimension_id: int):
    try:
        subdimension = get_subdimension_by_id(subdimension_id)
        if not subdimension:
            raise HTTPException(status_code=404, detail="Subdimension not found")
        return subdimension
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=SubdimensionCreateResponse)
def create_subdimension_route(payload: SubdimensionCreate):
    try:
        subdimension_id = create_subdimension(
            dimension_id=payload.dimension_id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            weight=payload.weight,
            display_order=payload.display_order,
            is_active=payload.is_active,
        )
        return SubdimensionCreateResponse(
            subdimension_id=subdimension_id,
            message="Subdimension created successfully",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{subdimension_id}")
def update_subdimension_route(subdimension_id: int, payload: SubdimensionUpdate):
    try:
        updated = update_subdimension(
            subdimension_id=subdimension_id,
            dimension_id=payload.dimension_id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            weight=payload.weight,
            display_order=payload.display_order,
            is_active=payload.is_active,
        )

        if not updated:
            raise HTTPException(status_code=404, detail="Subdimension not found")

        return {"message": "Subdimension updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{subdimension_id}/toggle")
def toggle_subdimension_route(subdimension_id: int):
    try:
        updated = toggle_subdimension_status(subdimension_id)

        if not updated:
            raise HTTPException(status_code=404, detail="Subdimension not found")

        return {"message": "Subdimension status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{subdimension_id}")
def delete_subdimension_route(subdimension_id: int):
    try:
        deleted = delete_subdimension(subdimension_id)

        if not deleted:
            raise HTTPException(status_code=404, detail="Subdimension not found")

        return {"message": "Subdimension deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))