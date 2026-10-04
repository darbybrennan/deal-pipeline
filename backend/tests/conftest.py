import pytest
from fastapi.testclient import TestClient

from app import config
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "DB_PATH", tmp_path / "test.db")
    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_client(client):
    r = client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert r.status_code == 200
    return client
