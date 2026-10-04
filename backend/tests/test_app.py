from app import config


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_hello(client):
    assert client.get("/api/hello").json() == {"message": "Hello from FastAPI"}


def test_db_created_on_startup(client):
    assert config.DB_PATH.exists()


def test_serves_frontend_index_when_built(client):
    if not config.STATIC_DIR.exists():
        return
    r = client.get("/")
    assert r.status_code == 200
    assert "<html" in r.text.lower()
