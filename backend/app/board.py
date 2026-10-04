import sqlite3

from app.models import BoardData
from app.seed import DEFAULT_BOARD, DEFAULT_BOARD_TITLE

CARD_FIELDS = ["title", "details", "property_type", "market", "size_sf", "price", "cap_rate"]


class BoardError(ValueError):
    pass


def get_or_create_board_id(conn: sqlite3.Connection, user_id: int) -> int:
    row = conn.execute("SELECT id FROM boards WHERE user_id = ?", (user_id,)).fetchone()
    if row:
        return row["id"]
    board_id = conn.execute(
        "INSERT INTO boards (user_id, title) VALUES (?, ?)", (user_id, DEFAULT_BOARD_TITLE)
    ).lastrowid
    _write(conn, board_id, DEFAULT_BOARD)
    conn.commit()
    return board_id


def load_board(conn: sqlite3.Connection, user_id: int) -> BoardData:
    board_id = get_or_create_board_id(conn, user_id)
    columns = conn.execute(
        "SELECT id, title FROM columns WHERE board_id = ? ORDER BY position", (board_id,)
    ).fetchall()
    cards = conn.execute(
        "SELECT * FROM cards WHERE board_id = ? ORDER BY column_id, position", (board_id,)
    ).fetchall()
    return BoardData(
        columns=[
            {
                "id": col["id"],
                "title": col["title"],
                "cardIds": [c["id"] for c in cards if c["column_id"] == col["id"]],
            }
            for col in columns
        ],
        cards={c["id"]: {"id": c["id"], **{f: c[f] for f in CARD_FIELDS}} for c in cards},
    )


def save_board(conn: sqlite3.Connection, user_id: int, board: BoardData) -> BoardData:
    board_id = get_or_create_board_id(conn, user_id)
    existing = [
        r["id"]
        for r in conn.execute(
            "SELECT id FROM columns WHERE board_id = ? ORDER BY position", (board_id,)
        )
    ]
    if [c.id for c in board.columns] != existing:
        raise BoardError("Columns are fixed: column ids and order cannot change")
    conn.execute("DELETE FROM cards WHERE board_id = ?", (board_id,))
    conn.execute("DELETE FROM columns WHERE board_id = ?", (board_id,))
    _write(conn, board_id, board)
    conn.commit()
    return load_board(conn, user_id)


def _write(conn: sqlite3.Connection, board_id: int, board: BoardData) -> None:
    for position, column in enumerate(board.columns):
        conn.execute(
            "INSERT INTO columns (board_id, id, title, position) VALUES (?, ?, ?, ?)",
            (board_id, column.id, column.title, position),
        )
        for card_position, card_id in enumerate(column.cardIds):
            card = board.cards[card_id]
            conn.execute(
                f"INSERT INTO cards (board_id, id, column_id, position, {', '.join(CARD_FIELDS)}) "
                f"VALUES (?, ?, ?, ?, {', '.join('?' * len(CARD_FIELDS))})",
                (board_id, card.id, column.id, card_position, *[getattr(card, f) for f in CARD_FIELDS]),
            )
