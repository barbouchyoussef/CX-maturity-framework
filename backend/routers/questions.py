from fastapi import APIRouter, HTTPException
from repositories.question_repository import (
    create_question,
    delete_question,
    get_all_questions,
    get_question_by_id,
    toggle_question_status,
    update_question,
)
from schemas.question import QuestionCreate, QuestionCreateResponse, QuestionOut, QuestionUpdate
from services.question_validation_service import validate_question_payload

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=list[QuestionOut])
def get_questions_route(sector_id: int | None = None, subdimension_id: int | None = None):
    try:
        return get_all_questions(sector_id=sector_id, subdimension_id=subdimension_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{question_id}", response_model=QuestionOut)
def get_question_route(question_id: int):
    try:
        question = get_question_by_id(question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        return question
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=QuestionCreateResponse)
def create_question_route(payload: QuestionCreate):
    try:
        validate_question_payload(payload)
        question_id = create_question(payload)
        return QuestionCreateResponse(
            question_id=question_id,
            message="Question created successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{question_id}")
def update_question_route(question_id: int, payload: QuestionUpdate):
    try:
        validate_question_payload(payload)
        updated = update_question(question_id, payload)
        if not updated:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"message": "Question updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{question_id}/toggle")
def toggle_question_route(question_id: int):
    try:
        updated = toggle_question_status(question_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"message": "Question status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{question_id}")
def delete_question_route(question_id: int):
    try:
        deleted = delete_question(question_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"message": "Question deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
