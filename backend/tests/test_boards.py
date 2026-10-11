from app import ai
from app.ai import AIResponse


def register(client, name, pw="pipeline1"):
    assert client.post("/api/auth/register", json={"username": name, "password": pw}).status_code == 200


def test_new_user_gets_sample_pipeline(client):
    register(client, "newbie")
    boards = client.get("/api/boards").json()
    assert len(boards) == 1 and boards[0]["title"] == "Acquisitions Pipeline" and boards[0]["deals"] == 8


def test_create_switch_rename_delete(auth_client):
    first = auth_client.get("/api/boards").json()[0]["id"]
    r = auth_client.post("/api/boards", json={"title": "Industrial Fund II"})
    second = r.json()["id"]
    data = auth_client.get(f"/api/boards/{second}/data").json()
    assert [c["title"] for c in data["columns"]][0] == "Sourcing" and data["cards"] == {}

    data["cards"]["d1"] = {"id": "d1", "title": "Ponchatoula Logistics", "details": "", "price": 30000000}
    data["columns"][0]["cardIds"] = ["d1"]
    assert auth_client.put(f"/api/boards/{second}/data", json=data).status_code == 200
    assert "d1" not in auth_client.get(f"/api/boards/{first}/data").json()["cards"]

    assert auth_client.patch(f"/api/boards/{second}", json={"title": "Fund II"}).status_code == 200
    titles = [b["title"] for b in auth_client.get("/api/boards").json()]
    assert titles == ["Acquisitions Pipeline", "Fund II"]

    assert auth_client.delete(f"/api/boards/{second}").status_code == 200
    assert len(auth_client.get("/api/boards").json()) == 1


def test_cannot_delete_last_board(auth_client):
    only = auth_client.get("/api/boards").json()[0]["id"]
    assert auth_client.delete(f"/api/boards/{only}").status_code == 400


def test_rejects_blank_title(auth_client):
    assert auth_client.post("/api/boards", json={"title": ""}).status_code == 422


def test_users_cannot_touch_each_others_boards(client):
    register(client, "alice")
    alice_board = client.get("/api/boards").json()[0]["id"]
    client.post("/api/auth/logout")
    register(client, "bobby")
    assert client.get(f"/api/boards/{alice_board}/data").status_code == 404
    assert client.patch(f"/api/boards/{alice_board}", json={"title": "mine"}).status_code == 404
    assert client.delete(f"/api/boards/{alice_board}").status_code == 404
    assert client.post(f"/api/boards/{alice_board}/chat", json={"message": "hi"}).status_code == 404


def test_chat_targets_selected_board(auth_client, monkeypatch):
    second = auth_client.post("/api/boards", json={"title": "Empty"}).json()["id"]
    seen = {}

    def fake(board, history, message):
        seen["cards"] = len(board.cards)
        return AIResponse(reply="ok", board=None)

    monkeypatch.setattr(ai, "chat", fake)
    auth_client.post(f"/api/boards/{second}/chat", json={"message": "count"})
    assert seen["cards"] == 0


def test_change_password(client):
    register(client, "changer", "oldpassword")
    bad = client.post("/api/auth/password", json={"current_password": "wrong", "new_password": "newpassword"})
    assert bad.status_code == 400
    ok = client.post("/api/auth/password", json={"current_password": "oldpassword", "new_password": "newpassword"})
    assert ok.status_code == 200
    assert client.get("/api/auth/me").status_code == 200  # still signed in here
    client.post("/api/auth/logout")
    assert client.post("/api/auth/login", json={"username": "changer", "password": "oldpassword"}).status_code == 401
    assert client.post("/api/auth/login", json={"username": "changer", "password": "newpassword"}).status_code == 200


def test_delete_account_removes_everything(client):
    register(client, "leaver")
    client.post("/api/boards", json={"title": "Second"})
    assert client.request("DELETE", "/api/auth/account", json={"password": "wrong"}).status_code == 400
    assert client.request("DELETE", "/api/auth/account", json={"password": "pipeline1"}).status_code == 200
    assert client.get("/api/auth/me").status_code == 401
    assert client.post("/api/auth/login", json={"username": "leaver", "password": "pipeline1"}).status_code == 401
    from app.db import get_conn

    with get_conn() as conn:
        assert conn.execute("SELECT COUNT(*) FROM boards").fetchone()[0] == 0
        assert conn.execute("SELECT COUNT(*) FROM cards").fetchone()[0] == 0
