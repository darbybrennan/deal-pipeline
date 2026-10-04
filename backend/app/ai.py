import json
from datetime import date

from openai import OpenAI
from pydantic import BaseModel

from app import config
from app.models import BoardData, ChatMessage

SYSTEM_PROMPT = """You are an acquisitions analyst assistant inside a commercial real estate deal pipeline app.
The user's pipeline is a Kanban board. Each card is a deal with optional fields:
property_type, market, size_sf (square feet), price (USD), cap_rate (percent, e.g. 6.25).
Columns are fixed and represent deal stages; you may rename a column only if asked, and never add,
remove or reorder columns.

You receive the current board as JSON plus the conversation. Answer concisely and accurately,
doing any math (totals, averages, price per SF) from the board data. Do not invent numbers.

If the user asks you to create, edit, move or delete deals, return the COMPLETE updated board in
"board" (every column and every card, with changes applied). New cards need a unique id like
"deal-<short random suffix>". Leave unknown deal fields null. If no change is needed, set "board"
to null. Always put your message to the user in "reply". Today is {today}."""


class AICard(BaseModel):
    id: str
    title: str
    details: str
    property_type: str | None
    market: str | None
    size_sf: int | None
    price: float | None
    cap_rate: float | None


class AIColumn(BaseModel):
    id: str
    title: str
    card_ids: list[str]


class AIBoard(BaseModel):
    columns: list[AIColumn]
    cards: list[AICard]


class AIResponse(BaseModel):
    reply: str
    board: AIBoard | None


def _client() -> OpenAI:
    return OpenAI(base_url=config.OPENROUTER_BASE_URL, api_key=config.openrouter_api_key())


def ping() -> str:
    response = _client().chat.completions.create(
        model=config.AI_MODEL,
        messages=[{"role": "user", "content": "What is 2+2? Reply with just the number."}],
    )
    return response.choices[0].message.content or ""


def to_board_data(board: AIBoard) -> BoardData:
    return BoardData(
        columns=[{"id": c.id, "title": c.title, "cardIds": c.card_ids} for c in board.columns],
        cards={c.id: c.model_dump() for c in board.cards},
    )


def chat(board: BoardData, history: list[ChatMessage], message: str) -> AIResponse:
    board_json = json.dumps(
        {
            "columns": [
                {"id": c.id, "title": c.title, "card_ids": c.cardIds} for c in board.columns
            ],
            "cards": [card.model_dump() for card in board.cards.values()],
        }
    )
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(today=date.today().isoformat())},
        {"role": "system", "content": f"Current board JSON:\n{board_json}"},
        *[m.model_dump() for m in history],
        {"role": "user", "content": message},
    ]
    response = _client().chat.completions.parse(
        model=config.AI_MODEL,
        messages=messages,
        response_format=AIResponse,
        extra_body={"provider": {"require_parameters": True}},
    )
    parsed = response.choices[0].message.parsed
    if parsed is None:
        raise ValueError("AI returned no structured output")
    return parsed
