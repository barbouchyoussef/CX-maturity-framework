from typing import Any
from db import get_db_cursor


def create_assessment(
    company_name: str | None,
    respondent_name: str | None,
    respondent_email: str | None,
    respondent_role_title: str | None,
    sector_id: int | None,
) -> int:
    query = """
        INSERT INTO assessments (
            company_name,
            respondent_name,
            respondent_email,
            respondent_role_title,
            sector_id,
            status
        )
        VALUES (%s, %s, %s, %s, %s, 'in_progress')
    """

    params = (
        company_name,
        respondent_name,
        respondent_email,
        respondent_role_title,
        sector_id,
    )

    with get_db_cursor(dictionary=False) as (conn, cursor):
        cursor.execute(query, params)
        return int(cursor.lastrowid)


def get_assessment_by_id(assessment_id: int) -> dict[str, Any] | None:
    query = """
        SELECT
            id,
            company_name,
            respondent_name,
            respondent_email,
            respondent_role_title,
            sector_id,
            status,
            overall_score,
            maturity_level,
            started_at,
            completed_at
        FROM assessments
        WHERE id = %s
        LIMIT 1
    """

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query, (assessment_id,))
        row = cursor.fetchone()

    if row and row.get("overall_score") is not None:
        row["overall_score"] = float(row["overall_score"])

    return row
