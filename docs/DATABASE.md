# Database

SQLite file at `PM_DB_PATH` (`/app/data/pm.db` in Docker, on the `pm-data` volume). Created automatically on startup with `CREATE TABLE IF NOT EXISTS`. The JSON shape the API exchanges is in `docs/schema.json`.

## Tables

| Table | Key columns | Purpose |
|---|---|---|
| users | id, username (unique) | One row per user. MVP only creates `user`, but the schema supports many. |
| sessions | token, user_id | Login sessions; token is the httpOnly cookie value. |
| boards | id, user_id, title | One board per user for the MVP; `title` kept for future multi-board support. |
| columns | (board_id, id), title, position | Fixed stage columns, ordered by `position`. Title is editable. |
| cards | (board_id, id), column_id, position, title, details, property_type, market, size_sf, price, cap_rate | Deals. Order within a column is `position`. Deal fields are nullable. |

## Approach

- Normalized tables instead of one JSON blob, so deals can be queried later (e.g. pipeline value by market) without parsing JSON.
- The API still exchanges the whole board as one JSON object (`BoardData`). A save replaces that board's columns and cards inside one transaction, which keeps ordering simple and consistent.
- Column ids and order are fixed; a save that adds, removes or reorders columns is rejected.
- First access for a user seeds the default acquisitions pipeline.
- Migrations: none needed for the MVP. If the schema changes, add an `ALTER TABLE` step in `db.init_db` or reset with `docker volume rm pm-data`.
