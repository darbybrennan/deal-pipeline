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
