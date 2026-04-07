from typing import Any
from db import get_db_cursor


def create_sector(
    name: str,
    code: str,
    description: str | None,
    display_order: int,
    is_active: bool,
) -> int:
    query = """
        INSERT INTO sectors (
            name,
            code,
            description,
            display_order,
            is_active
        )
        VALUES (%s, %s, %s, %s, %s)
    """

    params = (
        name,
        code,
        description,
        display_order,
        is_active,
    )

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, params)
        return int(cursor.lastrowid)


def get_all_sectors() -> list[dict[str, Any]]:
    query = """
        SELECT
            id,
            name,
            code,
            description,
            display_order,
            is_active
        FROM sectors
        ORDER BY display_order ASC, id ASC
    """

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query)
        rows = cursor.fetchall()

    for row in rows:
        row["is_active"] = bool(row["is_active"])

    return rows


def get_sector_by_id(sector_id: int) -> dict[str, Any] | None:
    query = """
        SELECT
            id,
            name,
            code,
            description,
            display_order,
            is_active
        FROM sectors
        WHERE id = %s
        LIMIT 1
    """

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query, (sector_id,))
        row = cursor.fetchone()

    if row:
        row["is_active"] = bool(row["is_active"])

    return row


def update_sector(
    sector_id: int,
    name: str,
    code: str,
    description: str | None,
    display_order: int,
    is_active: bool,
) -> bool:
    query = """
        UPDATE sectors
        SET
            name = %s,
            code = %s,
            description = %s,
            display_order = %s,
            is_active = %s
        WHERE id = %s
    """

    params = (
        name,
        code,
        description,
        display_order,
        is_active,
        sector_id,
    )

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, params)
        return cursor.rowcount > 0


def toggle_sector_status(sector_id: int) -> bool:
    query = """
        UPDATE sectors
        SET is_active = NOT is_active
        WHERE id = %s
    """

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, (sector_id,))
        return cursor.rowcount > 0
    
def delete_sector(sector_id: int) -> bool:
    query = """
        DELETE FROM sectors
        WHERE id = %s
    """

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, (sector_id,))
        return cursor.rowcount > 0