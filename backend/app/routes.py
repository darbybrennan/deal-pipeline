import sqlite3

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import ValidationError

from app import ai, auth, board, config
from app.db import db_dependency
from app.models import BoardData, ChatRequest, ChatResponse, LoginRequest

router = APIRouter(prefix="/api")


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/hello")
def hello():
    return {"message": "Hello from FastAPI"}


@router.post("/auth/login")
def login(body: LoginRequest, response: Response, conn: sqlite3.Connection = Depends(db_dependency)):
    if not auth.check_credentials(body.username, body.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    user_id = auth.get_or_create_user(conn, body.username)
    token = auth.create_session(conn, user_id)
    response.set_cookie(config.SESSION_COOKIE, token, httponly=True, samesite="lax")
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
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI request failed: {e}")


@router.post("/chat")
def chat(
    body: ChatRequest,
    user: dict = Depends(auth.current_user),
    conn: sqlite3.Connection = Depends(db_dependency),
) -> ChatResponse:
    current = board.load_board(conn, user["id"])
    try:
        result = ai.chat(current, body.history, body.message)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI request failed: {e}")
    if result.board is None:
        return ChatResponse(reply=result.reply)
    try:
        updated = board.save_board(conn, user["id"], ai.to_board_data(result.board))
    except (ValidationError, board.BoardError) as e:
        return ChatResponse(reply=f"{result.reply}\n\n(I couldn't apply that change: {e})")
    return ChatResponse(reply=result.reply, board=updated)
