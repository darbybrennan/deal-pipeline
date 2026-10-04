import pytest

from app import ai, config
from app.ai import AIBoard, AIResponse
from app.seed import DEFAULT_BOARD

live = pytest.mark.skipif(not config.openrouter_api_key(), reason="OPENROUTER_API_KEY not set")


def board_as_ai(move_deal_1_to_closed=False) -> AIBoard:
    columns = [{"id": c.id, "title": c.title, "card_ids": list(c.cardIds)} for c in DEFAULT_BOARD.columns]
    if move_deal_1_to_closed:
        columns[0]["card_ids"].remove("deal-1")
        columns[4]["card_ids"].append("deal-1")
    return AIBoard(columns=columns, cards=[c.model_dump() for c in DEFAULT_BOARD.cards.values()])


def test_chat_reply_without_update(auth_client, monkeypatch):
    monkeypatch.setattr(ai, "chat", lambda *a: AIResponse(reply="You have 8 deals.", board=None))
    r = auth_client.post("/api/chat", json={"message": "How many deals?"})
    assert r.status_code == 200
    assert r.json() == {"reply": "You have 8 deals.", "board": None}


def test_chat_applies_board_update(auth_client, monkeypatch):
    monkeypatch.setattr(ai, "chat", lambda *a: AIResponse(reply="Moved.", board=board_as_ai(True)))
    r = auth_client.post("/api/chat", json={"message": "Close Riverbend"})
    assert r.json()["board"]["columns"][4]["cardIds"][-1] == "deal-1"
    assert "deal-1" in auth_client.get("/api/board").json()["columns"][4]["cardIds"]


def test_chat_rejects_invalid_update(auth_client, monkeypatch):
    bad = board_as_ai()
    bad.columns[0].card_ids.remove("deal-1")  # orphan card
    monkeypatch.setattr(ai, "chat", lambda *a: AIResponse(reply="Done.", board=bad))
    r = auth_client.post("/api/chat", json={"message": "break it"})
    assert r.json()["board"] is None
    assert "couldn't apply" in r.json()["reply"]
    assert "deal-1" in auth_client.get("/api/board").json()["columns"][0]["cardIds"]


def test_chat_passes_history(auth_client, monkeypatch):
    seen = {}

    def fake(board, history, message):
        seen["history"] = history
        return AIResponse(reply="ok", board=None)

    monkeypatch.setattr(ai, "chat", fake)
    auth_client.post(
        "/api/chat",
        json={"message": "and?", "history": [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]},
    )
    assert [m.role for m in seen["history"]] == ["user", "assistant"]


def test_chat_ai_failure_returns_502(auth_client, monkeypatch):
    def boom(*a):
        raise RuntimeError("down")

    monkeypatch.setattr(ai, "chat", boom)
    assert auth_client.post("/api/chat", json={"message": "hi"}).status_code == 502


@live
def test_live_ping(auth_client):
    assert "4" in auth_client.get("/api/chat/ping").json()["answer"]


@live
def test_live_chat_moves_card(auth_client):
    r = auth_client.post(
        "/api/chat",
        json={"message": "Move Riverbend Logistics Center to the Closed column."},
    )
    assert r.status_code == 200
    closed = auth_client.get("/api/board").json()["columns"][4]["cardIds"]
    assert "deal-1" in closed


@live
def test_live_chat_answers_question(auth_client):
    r = auth_client.post("/api/chat", json={"message": "How many deals are in Underwriting? Answer with a number."})
    assert "2" in r.json()["reply"]
