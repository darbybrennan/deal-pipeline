def test_login_success_sets_cookie(client):
    r = client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert r.status_code == 200
    assert "pm_session" in r.cookies
    assert client.get("/api/auth/me").json() == {"username": "user"}


def test_login_bad_password(client):
    r = client.post("/api/auth/login", json={"username": "user", "password": "nope"})
    assert r.status_code == 401


def test_protected_routes_require_login(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/board").status_code == 401
    assert client.post("/api/chat", json={"message": "hi"}).status_code == 401


def test_logout_ends_session(auth_client):
    assert auth_client.post("/api/auth/logout").status_code == 200
    assert auth_client.get("/api/auth/me").status_code == 401


def test_invalid_session_token(client):
    client.cookies.set("pm_session", "made-up")
    assert client.get("/api/board").status_code == 401


def test_passwords_are_hashed(client):
    from app.db import get_conn

    with get_conn() as conn:
        stored = conn.execute("SELECT password_hash FROM users WHERE username = 'user'").fetchone()[0]
    assert stored.startswith("scrypt$") and "password" not in stored


def test_register_and_sign_in(client):
    r = client.post("/api/auth/register", json={"username": "darby", "password": "dealflow1"})
    assert r.status_code == 200
    assert client.get("/api/auth/me").json() == {"username": "darby"}
    client.post("/api/auth/logout")
    assert client.post("/api/auth/login", json={"username": "darby", "password": "dealflow1"}).status_code == 200


def test_register_validation(client):
    assert client.post("/api/auth/register", json={"username": "ab", "password": "longenough"}).status_code == 400
    assert client.post("/api/auth/register", json={"username": "okname", "password": "short"}).status_code == 400
    assert client.post("/api/auth/register", json={"username": "user", "password": "longenough"}).status_code == 400


def test_expired_session_rejected(auth_client):
    from app.db import get_conn

    with get_conn() as conn:
        conn.execute("UPDATE sessions SET created_at = datetime('now', '-8 days')")
        conn.commit()
    assert auth_client.get("/api/auth/me").status_code == 401


def test_legacy_db_gets_password_column(tmp_path, monkeypatch):
    import sqlite3

    from app import config
    from app.db import init_db

    path = tmp_path / "old.db"
    sqlite3.connect(path).executescript(
        "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE,"
        " created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);"
    )
    monkeypatch.setattr(config, "DB_PATH", path)
    init_db()
    cols = [r[1] for r in sqlite3.connect(path).execute("PRAGMA table_info(users)")]
    assert "password_hash" in cols
