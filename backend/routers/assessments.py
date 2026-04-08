from fastapi import APIRouter, HTTPException
from schemas.assessment import (
    AssessmentCreate,
    AssessmentCreateResponse,
    AssessmentOut,
    AssessmentResultsOut,
    AssessmentSubmitRequest,
    AssessmentSubmitResponse,
)
from repositories.assessment_repository import create_assessment, get_assessment_by_id
from services.assessment_scoring_service import (
    get_assessment_results,
    submit_assessment_answers,
)

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.get("/{assessment_id}", response_model=AssessmentOut)
def get_assessment_route(assessment_id: int):
    try:
        assessment = get_assessment_by_id(assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        return assessment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


@router.post("/{assessment_id}/submit", response_model=AssessmentSubmitResponse)
def submit_assessment_route(assessment_id: int, payload: AssessmentSubmitRequest):
    try:
        return submit_assessment_answers(assessment_id, payload.answers)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{assessment_id}/results", response_model=AssessmentResultsOut)
def get_assessment_results_route(assessment_id: int):
    try:
        return get_assessment_results(assessment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
