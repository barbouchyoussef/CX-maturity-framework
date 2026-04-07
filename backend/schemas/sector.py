from pydantic import BaseModel
from typing import Optional


class SectorCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class SectorUpdate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class SectorOut(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    display_order: int
    is_active: bool


class SectorCreateResponse(BaseModel):
    sector_id: int
    message: str