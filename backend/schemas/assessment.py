from pydantic import BaseModel, EmailStr
from typing import Optional


class AssessmentCreate(BaseModel):
    company_name: Optional[str] = None
    respondent_name: Optional[str] = None
    respondent_email: Optional[EmailStr] = None
    respondent_role_title: Optional[str] = None
    sector_id: Optional[int] = None


class AssessmentCreateResponse(BaseModel):
    assessment_id: int
    message: str