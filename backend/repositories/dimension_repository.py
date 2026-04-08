from typing import Any
from db import get_db_cursor


def create_dimension(
    name: str,
    code: str,
    description: str | None,
    weight: float,
    display_order: int,
    is_active: bool,
) -> int:
    query = """
        INSERT INTO dimensions (
            name,
            code,
            description,
            weight,
            display_order,
            is_active
        )
        VALUES (%s, %s, %s, %s, %s, %s)
    """

    params = (
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


def get_all_dimensions() -> list[dict[str, Any]]:
    query = """
        SELECT
            id,
            name,
            code,
            description,
            weight,
            display_order,
            is_active
        FROM dimensions
        ORDER BY display_order ASC, id ASC
    """

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query)
        rows = cursor.fetchall()

    for row in rows:
        row["is_active"] = bool(row["is_active"])
        row["weight"] = float(row["weight"])

    return rows


def get_dimension_by_id(dimension_id: int) -> dict[str, Any] | None:
    query = """
        SELECT
            id,
            name,
            code,
            description,
            weight,
            display_order,
            is_active
        FROM dimensions
        WHERE id = %s
        LIMIT 1
    """

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query, (dimension_id,))
        row = cursor.fetchone()

    if row:
        row["is_active"] = bool(row["is_active"])
        row["weight"] = float(row["weight"])

    return row


def update_dimension(
    dimension_id: int,
    name: str,
    code: str,
    description: str | None,
    weight: float,
    display_order: int,
    is_active: bool,
) -> bool:
    query = """
        UPDATE dimensions
        SET
            name = %s,
            code = %s,
            description = %s,
            weight = %s,
            display_order = %s,
            is_active = %s
        WHERE id = %s
    """

    params = (
        name,
        code,
        description,
        weight,
        display_order,
        is_active,
        dimension_id,
    )

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, params)
        if cursor.rowcount > 0:
            return True

        cursor.execute(
            "SELECT id FROM dimensions WHERE id = %s LIMIT 1",
            (dimension_id,),
        )
        return cursor.fetchone() is not None


def toggle_dimension_status(dimension_id: int) -> bool:
    query = """
        UPDATE dimensions
        SET is_active = NOT is_active
        WHERE id = %s
    """

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, (dimension_id,))
        return cursor.rowcount > 0


def delete_dimension(dimension_id: int) -> bool:
    query = """
        DELETE FROM dimensions
        WHERE id = %s
    """

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, (dimension_id,))
        return cursor.rowcount > 0
