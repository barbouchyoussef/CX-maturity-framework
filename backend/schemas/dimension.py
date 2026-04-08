from pydantic import BaseModel
from typing import Optional


class DimensionCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    weight: float = 1.0
    display_order: int = 0
    is_active: bool = True


class DimensionUpdate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    weight: float = 1.0
    display_order: int = 0
    is_active: bool = True


class DimensionOut(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    weight: float
    display_order: int
    is_active: bool


class DimensionCreateResponse(BaseModel):
    dimension_id: int
    message: str
