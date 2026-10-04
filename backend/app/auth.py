import secrets
import sqlite3

from fastapi import Cookie, Depends, HTTPException

from app import config
from app.db import db_dependency


def check_credentials(username: str, password: str) -> bool:
    return secrets.compare_digest(username, config.DEMO_USERNAME) and secrets.compare_digest(
        password, config.DEMO_PASSWORD
    )


def get_or_create_user(conn: sqlite3.Connection, username: str) -> int:
    row = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if row:
        return row["id"]
    user_id = conn.execute("INSERT INTO users (username) VALUES (?)", (username,)).lastrowid
    conn.commit()
    return user_id


def create_session(conn: sqlite3.Connection, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
    conn.commit()
    return token


def delete_session(conn: sqlite3.Connection, token: str) -> None:
    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()


def current_user(
    pm_session: str | None = Cookie(default=None),
    conn: sqlite3.Connection = Depends(db_dependency),
) -> dict:
    if not pm_session:
        raise HTTPException(status_code=401, detail="Not signed in")
    row = conn.execute(
        "SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id "
        "WHERE sessions.token = ?",
        (pm_session,),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Not signed in")
    return {"id": row["id"], "username": row["username"]}
