# Frontend

Next.js (App Router, TypeScript, Tailwind v4) single-page Kanban board. Built as a static export (`output: "export"`) into `frontend/out/`, which the FastAPI backend serves at `/`.

## Layout

- `src/app/` - `layout.tsx` (fonts, metadata), `page.tsx` (auth gate: login screen or board), `globals.css` (color tokens).
- `src/components/`
  - `KanbanBoard.tsx` - board state, drag and drop (dnd-kit), loads/saves the board via the API, hosts the chat sidebar.
  - `KanbanColumn.tsx` - droppable column with editable title and new-card form.
  - `KanbanCard.tsx` - sortable card with edit and remove.
  - `KanbanCardPreview.tsx` - card shown in the drag overlay.
  - `NewCardForm.tsx` / `CardEditor.tsx` - add and edit card forms.
  - `LoginForm.tsx` - sign-in screen.
  - `ChatSidebar.tsx` - AI assistant chat panel.
- `src/lib/`
  - `kanban.ts` - types (`Card`, `Column`, `BoardData`), `moveCard` pure function, id helper.
  - `api.ts` - fetch wrappers for `/api/*` (cookies carry the session).
  - `deals.ts` - CRE deal formatting and pipeline metrics.

## Tests

- Unit: Vitest + Testing Library, `npm test` (files in `src/**/*.test.ts(x)`; `fetch` is mocked).
- E2E: Playwright in `tests/`, run against the real container at `http://127.0.0.1:8000` (`npm run test:e2e`).

## Notes

- All board state lives in one `BoardData` object; every change is saved with `PUT /api/board`.
- Colors come from CSS variables in `globals.css`; do not hardcode new colors.
