from fastapi import APIRouter, HTTPException
from schemas.assessment import AssessmentCreate, AssessmentCreateResponse
from repositories.assessment_repository import create_assessment

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.post("", response_model=AssessmentCreateResponse)
def create_assessment_route(payload: AssessmentCreate):
    try:
        assessment_id = create_assessment(
            company_name=payload.company_name,
            respondent_name=payload.respondent_name,
            respondent_email=payload.respondent_email,
            respondent_role_title=payload.respondent_role_title,
            sector_id=payload.sector_id,
        )
        return AssessmentCreateResponse(
            assessment_id=assessment_id,
            message="Assessment created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))