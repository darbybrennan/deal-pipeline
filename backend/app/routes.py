import logging
import sqlite3

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import ValidationError

from app import ai, auth, board, config
from app.db import db_dependency
from app.models import BoardData, ChatRequest, ChatResponse, LoginRequest

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

AI_ERROR = "The AI analyst is unavailable right now. Try again in a moment."


def _start_session(conn: sqlite3.Connection, response: Response, user_id: int) -> None:
    token = auth.create_session(conn, user_id)
    response.set_cookie(
        config.SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        max_age=config.SESSION_MAX_AGE_DAYS * 86400,
    )


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/auth/register")
def register(body: LoginRequest, response: Response, conn: sqlite3.Connection = Depends(db_dependency)):
    try:
        user_id = auth.register(conn, body.username, body.password)
    except auth.AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))
    _start_session(conn, response, user_id)
    return {"username": body.username}


@router.post("/auth/login")
def login(body: LoginRequest, response: Response, conn: sqlite3.Connection = Depends(db_dependency)):
    user_id = auth.authenticate(conn, body.username, body.password)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    _start_session(conn, response, user_id)
    return {"username": body.username}


@router.post("/auth/logout")
def logout(
    response: Response,
    pm_session: str | None = Cookie(default=None),
    conn: sqlite3.Connection = Depends(db_dependency),
):
    if pm_session:
        auth.delete_session(conn, pm_session)
    response.delete_cookie(config.SESSION_COOKIE)
    return {"ok": True}


@router.get("/auth/me")
def me(user: dict = Depends(auth.current_user)):
    return {"username": user["username"]}


@router.get("/board")
def get_board(user: dict = Depends(auth.current_user), conn: sqlite3.Connection = Depends(db_dependency)) -> BoardData:
    return board.load_board(conn, user["id"])


@router.put("/board")
def put_board(
    body: BoardData,
    user: dict = Depends(auth.current_user),
    conn: sqlite3.Connection = Depends(db_dependency),
) -> BoardData:
    try:
        return board.save_board(conn, user["id"], body)
    except board.BoardError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/chat/ping")
def chat_ping(user: dict = Depends(auth.current_user)):
    try:
        return {"answer": ai.ping()}
    except Exception:
        log.exception("AI ping failed")
        raise HTTPException(status_code=502, detail=AI_ERROR)


def removed_deals(before: BoardData, after: BoardData) -> list[str]:
    return [card.title for card_id, card in before.cards.items() if card_id not in after.cards]


@router.post("/chat")
def chat(
    body: ChatRequest,
    user: dict = Depends(auth.current_user),
    conn: sqlite3.Connection = Depends(db_dependency),
) -> ChatResponse:
    current = board.load_board(conn, user["id"])
    history = body.history[-config.MAX_CHAT_HISTORY :]
    try:
        result = ai.chat(current, history, body.message)
    except Exception:
        log.exception("AI chat failed")
        raise HTTPException(status_code=502, detail=AI_ERROR)
    if result.board is None:
        return ChatResponse(reply=result.reply)
    try:
        proposed = ai.to_board_data(result.board)
        updated = board.save_board(conn, user["id"], proposed)
    except (ValidationError, board.BoardError) as e:
        return ChatResponse(reply=f"{result.reply}\n\n(I couldn't apply that change: {e})")
    reply = result.reply
    gone = removed_deals(current, updated)
    if gone:
        reply += f"\n\nRemoved from the pipeline: {', '.join(gone)}."
    return ChatResponse(reply=reply, board=updated)
