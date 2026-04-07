from typing import Any
from db import get_db_cursor


def create_subdimension(
    dimension_id: int,
    name: str,
    code: str,
    description: str | None,
    weight: float,
    display_order: int,
    is_active: bool,
) -> int:
    query = """
        INSERT INTO subdimensions (
            dimension_id,
            name,
            code,
            description,
            weight,
            display_order,
            is_active
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    params = (
        dimension_id,
        name,
        code,
        description,
        weight,
        display_order,
        is_active,
    )

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, params)
        return int(cursor.lastrowid)


def get_all_subdimensions() -> list[dict[str, Any]]:
    query = """
        SELECT
            id,
            dimension_id,
            name,
            code,
            description,
            weight,
            display_order,
            is_active
        FROM subdimensions
        ORDER BY dimension_id ASC, display_order ASC, id ASC
    """

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query)
        rows = cursor.fetchall()

    for row in rows:
        row["is_active"] = bool(row["is_active"])
        row["weight"] = float(row["weight"])

    return rows


def get_subdimensions_by_dimension(dimension_id: int) -> list[dict[str, Any]]:
    query = """
        SELECT
            id,
            dimension_id,
            name,
            code,
            description,
            weight,
            display_order,
            is_active
        FROM subdimensions
        WHERE dimension_id = %s
        ORDER BY display_order ASC, id ASC
    """

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query, (dimension_id,))
        rows = cursor.fetchall()

    for row in rows:
        row["is_active"] = bool(row["is_active"])
        row["weight"] = float(row["weight"])

    return rows


def get_subdimension_by_id(subdimension_id: int) -> dict[str, Any] | None:
    query = """
        SELECT
            id,
            dimension_id,
            name,
            code,
            description,
            weight,
            display_order,
            is_active
        FROM subdimensions
        WHERE id = %s
        LIMIT 1
    """

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query, (subdimension_id,))
        row = cursor.fetchone()

    if row:
        row["is_active"] = bool(row["is_active"])
        row["weight"] = float(row["weight"])

    return row


def update_subdimension(
    subdimension_id: int,
    dimension_id: int,
    name: str,
    code: str,
    description: str | None,
    weight: float,
    display_order: int,
    is_active: bool,
) -> bool:
    query = """
        UPDATE subdimensions
        SET
            dimension_id = %s,
            name = %s,
            code = %s,
            description = %s,
            weight = %s,
            display_order = %s,
            is_active = %s
        WHERE id = %s
    """

    params = (
        dimension_id,
        name,
        code,
        description,
        weight,
        display_order,
        is_active,
        subdimension_id,
    )

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, params)
        return cursor.rowcount > 0


def toggle_subdimension_status(subdimension_id: int) -> bool:
    query = """
        UPDATE subdimensions
        SET is_active = NOT is_active
        WHERE id = %s
    """

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, (subdimension_id,))
        return cursor.rowcount > 0


def delete_subdimension(subdimension_id: int) -> bool:
    query = """
        DELETE FROM subdimensions
        WHERE id = %s
    """

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, (subdimension_id,))
        return cursor.rowcount > 0