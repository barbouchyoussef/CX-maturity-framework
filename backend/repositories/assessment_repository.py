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