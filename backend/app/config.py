import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

load_dotenv(PROJECT_ROOT / ".env")

DB_PATH = Path(os.getenv("PM_DB_PATH", BACKEND_DIR / "data" / "pm.db"))
STATIC_DIR = Path(os.getenv("PM_STATIC_DIR", PROJECT_ROOT / "frontend" / "out"))

DEMO_USERNAME = "user"
DEMO_PASSWORD = "password"
SESSION_COOKIE = "pm_session"

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
AI_MODEL = "openai/gpt-oss-120b"


def openrouter_api_key() -> str | None:
    return os.getenv("OPENROUTER_API_KEY")
