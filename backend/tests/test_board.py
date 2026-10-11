from app import auth, board
from app.db import get_conn
from app.models import BoardData


def test_default_board(auth_client):
    data = auth_client.get("/api/board").json()
    assert [c["title"] for c in data["columns"]] == [
        "Sourcing",
        "Underwriting",
        "LOI",
        "Due Diligence",
        "Closed",
    ]
    assert len(data["cards"]) == 8
    assert data["cards"]["deal-1"]["market"] == "Dallas-Fort Worth"


def test_move_card_persists(auth_client):
    data = auth_client.get("/api/board").json()
    data["columns"][0]["cardIds"].remove("deal-1")
    data["columns"][4]["cardIds"].insert(0, "deal-1")
    assert auth_client.put("/api/board", json=data).status_code == 200

    again = auth_client.get("/api/board").json()
    assert again["columns"][4]["cardIds"][0] == "deal-1"
    assert "deal-1" not in again["columns"][0]["cardIds"]


def test_rename_add_edit_delete(auth_client):
    data = auth_client.get("/api/board").json()
    data["columns"][1]["title"] = "UW"
    data["cards"]["deal-new"] = {"id": "deal-new", "title": "New deal", "details": "", "price": 1000000}
    data["columns"][0]["cardIds"].append("deal-new")
    data["cards"]["deal-2"]["cap_rate"] = 7.5
    del data["cards"]["deal-8"]
    data["columns"][4]["cardIds"].remove("deal-8")
    auth_client.put("/api/board", json=data)

    again = auth_client.get("/api/board").json()
    assert again["columns"][1]["title"] == "UW"
    assert again["cards"]["deal-new"]["price"] == 1000000
    assert again["cards"]["deal-2"]["cap_rate"] == 7.5
    assert "deal-8" not in again["cards"]


def test_rejects_orphan_card(auth_client):
    data = auth_client.get("/api/board").json()
    data["columns"][0]["cardIds"].remove("deal-1")
    assert auth_client.put("/api/board", json=data).status_code == 422


def test_rejects_duplicate_card(auth_client):
    data = auth_client.get("/api/board").json()
    data["columns"][1]["cardIds"].append("deal-1")
    assert auth_client.put("/api/board", json=data).status_code == 422


def test_rejects_column_changes(auth_client):
    data = auth_client.get("/api/board").json()
    data["columns"].append({"id": "col-extra", "title": "Extra", "cardIds": []})
    assert auth_client.put("/api/board", json=data).status_code == 400


def test_rejects_bad_cap_rate(auth_client):
    data = auth_client.get("/api/board").json()
    data["cards"]["deal-1"]["cap_rate"] = 250
    assert auth_client.put("/api/board", json=data).status_code == 422


def test_boards_are_per_user(client):
    with get_conn() as conn:
        a = auth.register(conn, "alice", "alicepass1")
        b = auth.register(conn, "bobby", "bobbypass1")
        alice = board.load_board(conn, a)
        alice.columns[0].title = "Alice only"
        board.save_board(conn, a, alice)
        assert board.load_board(conn, b).columns[0].title == "Sourcing"
        assert board.load_board(conn, a).columns[0].title == "Alice only"


def test_board_survives_new_session(auth_client):
    data = auth_client.get("/api/board").json()
    data["columns"][0]["title"] = "Pipeline"
    auth_client.put("/api/board", json=data)
    auth_client.post("/api/auth/logout")
    auth_client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert auth_client.get("/api/board").json()["columns"][0]["title"] == "Pipeline"


def test_board_model_roundtrip():
    from app.seed import DEFAULT_BOARD

    assert BoardData.model_validate(DEFAULT_BOARD.model_dump()) == DEFAULT_BOARD
