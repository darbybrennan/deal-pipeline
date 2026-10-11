import hashlib
import hmac
import re
import secrets
import sqlite3

from fastapi import Cookie, Depends, HTTPException

from app import config
from app.db import db_dependency

USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]{3,32}$")
MIN_PASSWORD = 8


class AuthError(ValueError):
    pass


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored:
        return False
    _, salt_hex, digest_hex = stored.split("$")
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
    return hmac.compare_digest(digest.hex(), digest_hex)


def validate_new_credentials(username: str, password: str) -> None:
    if not USERNAME_RE.match(username):
        raise AuthError("Username must be 3-32 letters, numbers, dots, dashes or underscores")
    if len(password) < MIN_PASSWORD:
        raise AuthError(f"Password must be at least {MIN_PASSWORD} characters")


def register(conn: sqlite3.Connection, username: str, password: str) -> int:
    validate_new_credentials(username, password)
    if conn.execute("SELECT 1 FROM users WHERE username = ?", (username,)).fetchone():
        raise AuthError("That username is taken")
    user_id = conn.execute(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        (username, hash_password(password)),
    ).lastrowid
    conn.commit()
    return user_id


def authenticate(conn: sqlite3.Connection, username: str, password: str) -> int | None:
    row = conn.execute(
        "SELECT id, password_hash FROM users WHERE username = ?", (username,)
    ).fetchone()
    if row and verify_password(password, row["password_hash"]):
        return row["id"]
    return None


def ensure_demo_user(conn: sqlite3.Connection) -> None:
    """Keep the course demo login (user / password) working, stored as a hash."""
    row = conn.execute(
        "SELECT id, password_hash FROM users WHERE username = ?", (config.DEMO_USERNAME,)
    ).fetchone()
    if row is None:
        conn.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (config.DEMO_USERNAME, hash_password(config.DEMO_PASSWORD)),
        )
    elif not row["password_hash"]:
        conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(config.DEMO_PASSWORD), row["id"]),
        )
    conn.commit()


def change_password(conn: sqlite3.Connection, user_id: int, current: str, new: str) -> None:
    row = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
    if not verify_password(current, row["password_hash"]):
        raise AuthError("Current password is incorrect")
    if len(new) < MIN_PASSWORD:
        raise AuthError(f"Password must be at least {MIN_PASSWORD} characters")
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new), user_id))
    conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
    conn.commit()


def delete_user(conn: sqlite3.Connection, user_id: int, password: str) -> None:
    row = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
    if not verify_password(password, row["password_hash"]):
        raise AuthError("Password is incorrect")
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()


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
        "WHERE sessions.token = ? AND sessions.created_at > datetime('now', ?)",
        (pm_session, f"-{config.SESSION_MAX_AGE_DAYS} days"),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Not signed in")
    return {"id": row["id"], "username": row["username"]}
