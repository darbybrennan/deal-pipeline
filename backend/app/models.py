from pydantic import BaseModel, Field, model_validator


class Card(BaseModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    details: str = ""
    property_type: str | None = None
    market: str | None = None
    size_sf: int | None = Field(default=None, ge=0)
    price: float | None = Field(default=None, ge=0)
    cap_rate: float | None = Field(default=None, ge=0, le=100)


class Column(BaseModel):
    id: str = Field(min_length=1)
    title: str
    cardIds: list[str]


class BoardData(BaseModel):
    columns: list[Column]
    cards: dict[str, Card]

    @model_validator(mode="after")
    def check_consistency(self) -> "BoardData":
        placed = [card_id for column in self.columns for card_id in column.cardIds]
        if len(placed) != len(set(placed)):
            raise ValueError("A card appears in more than one place")
        if set(placed) != set(self.cards):
            raise ValueError("Every card must be in exactly one column")
        for key, card in self.cards.items():
            if key != card.id:
                raise ValueError(f"Card key {key} does not match id {card.id}")
        return self


class LoginRequest(BaseModel):
    username: str
    password: str


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    board: BoardData | None = None
