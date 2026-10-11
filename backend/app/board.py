import sqlite3

from app.models import BoardData
from app.seed import DEFAULT_BOARD, DEFAULT_BOARD_TITLE, empty_board

CARD_FIELDS = ["title", "details", "property_type", "market", "size_sf", "price", "cap_rate"]


class BoardError(ValueError):
    pass


class BoardNotFound(LookupError):
    pass


def list_boards(conn: sqlite3.Connection, user_id: int) -> list[dict]:
    rows = conn.execute(
        "SELECT boards.id, boards.title, COUNT(cards.id) AS deals FROM boards "
        "LEFT JOIN cards ON cards.board_id = boards.id WHERE boards.user_id = ? "
        "GROUP BY boards.id ORDER BY boards.id",
        (user_id,),
    ).fetchall()
    if not rows:
        create_board(conn, user_id, DEFAULT_BOARD_TITLE, sample=True)
        return list_boards(conn, user_id)
    return [{"id": r["id"], "title": r["title"], "deals": r["deals"]} for r in rows]


def create_board(conn: sqlite3.Connection, user_id: int, title: str, sample: bool = False) -> int:
    board_id = conn.execute(
        "INSERT INTO boards (user_id, title) VALUES (?, ?)", (user_id, title)
    ).lastrowid
    _write(conn, board_id, DEFAULT_BOARD if sample else empty_board())
    conn.commit()
    return board_id


def _owned(conn: sqlite3.Connection, user_id: int, board_id: int) -> None:
    row = conn.execute(
        "SELECT 1 FROM boards WHERE id = ? AND user_id = ?", (board_id, user_id)
    ).fetchone()
    if not row:
        raise BoardNotFound("Board not found")


def rename_board(conn: sqlite3.Connection, user_id: int, board_id: int, title: str) -> None:
    _owned(conn, user_id, board_id)
    conn.execute("UPDATE boards SET title = ? WHERE id = ?", (title, board_id))
    conn.commit()


def delete_board(conn: sqlite3.Connection, user_id: int, board_id: int) -> None:
    _owned(conn, user_id, board_id)
    count = conn.execute("SELECT COUNT(*) FROM boards WHERE user_id = ?", (user_id,)).fetchone()[0]
    if count <= 1:
        raise BoardError("You need at least one pipeline")
    conn.execute("DELETE FROM boards WHERE id = ?", (board_id,))
    conn.commit()


def default_board_id(conn: sqlite3.Connection, user_id: int) -> int:
    return list_boards(conn, user_id)[0]["id"]


def load_board(conn: sqlite3.Connection, user_id: int, board_id: int | None = None) -> BoardData:
    if board_id is None:
        board_id = default_board_id(conn, user_id)
    _owned(conn, user_id, board_id)
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


def save_board(
    conn: sqlite3.Connection, user_id: int, board: BoardData, board_id: int | None = None
) -> BoardData:
    if board_id is None:
        board_id = default_board_id(conn, user_id)
    _owned(conn, user_id, board_id)
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
    return load_board(conn, user_id, board_id)


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
