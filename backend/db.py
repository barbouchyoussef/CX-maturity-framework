import mysql.connector
from contextlib import contextmanager


def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="cx_maturity_framework",
    )


@contextmanager
def get_db_cursor(dictionary: bool = True):
    conn = get_connection()
    cursor = conn.cursor(dictionary=dictionary)
    try:
        yield conn, cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()