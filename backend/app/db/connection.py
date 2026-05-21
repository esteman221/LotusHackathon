from contextlib import contextmanager

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.core.config import settings


pool: ConnectionPool | None = None


def init_db_pool() -> None:
    global pool

    if pool is None:
        pool = ConnectionPool(
            conninfo=settings.database_url,
            min_size=1,
            max_size=5,
            kwargs={
                "row_factory": dict_row
            }
        )


def close_db_pool() -> None:
    global pool

    if pool is not None:
        pool.close()
        pool = None


@contextmanager
def get_connection():
    if pool is None:
        init_db_pool()

    with pool.connection() as conn:
        yield conn