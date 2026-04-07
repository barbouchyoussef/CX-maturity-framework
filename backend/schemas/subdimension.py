from pydantic import BaseModel
from typing import Optional


class SubdimensionCreate(BaseModel):
    dimension_id: int
    name: str
    code: str
    description: Optional[str] = None
    weight: float = 1.0
    display_order: int = 0
    is_active: bool = True


class SubdimensionUpdate(BaseModel):
    dimension_id: int
    name: str
    code: str
    description: Optional[str] = None
    weight: float = 1.0
    display_order: int = 0
    is_active: bool = True


class SubdimensionOut(BaseModel):
    id: int
    dimension_id: int
    name: str
    code: str
    description: Optional[str] = None
    weight: float
    display_order: int
    is_active: bool


class SubdimensionCreateResponse(BaseModel):
    subdimension_id: int
    message: str