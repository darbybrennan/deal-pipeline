import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";
import { api } from "@/lib/api";
import type { BoardData } from "@/lib/kanban";

vi.mock("@/lib/api", () => ({
  api: { getBoard: vi.fn(), saveBoard: vi.fn(), chat: vi.fn() },
}));

const board = (): BoardData => ({
  columns: [
    { id: "col-a", title: "Sourcing", cardIds: ["deal-1"] },
    { id: "col-b", title: "Underwriting", cardIds: [] },
    { id: "col-c", title: "Closed", cardIds: ["deal-2"] },
  ],
  cards: {
    "deal-1": { id: "deal-1", title: "Riverbend", details: "Bulk", property_type: "Industrial", market: "DFW", size_sf: 100000, price: 10000000, cap_rate: 6 },
    "deal-2": { id: "deal-2", title: "Harbor Point", details: "", price: 5000000, cap_rate: 5 },
  },
});

const mocked = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getBoard.mockResolvedValue(board());
  mocked.saveBoard.mockImplementation(async (_id: number, b: BoardData) => b);
});

const renderBoard = async () => {
  render(<KanbanBoard boardId={1} onLogout={vi.fn()} />);
  await screen.findByText("Riverbend");
};

const firstColumn = () => screen.getAllByTestId(/column-/i)[0];

describe("KanbanBoard", () => {
  it("loads the board from the API", async () => {
    await renderBoard();
    expect(screen.getAllByTestId(/column-/i)).toHaveLength(3);
    expect(screen.getByText("Industrial / DFW")).toBeInTheDocument();
  });

  it("shows pipeline metrics", async () => {
    await renderBoard();
    const stats = screen.getByText("Active pipeline").parentElement!;
    expect(within(stats).getByText("$10.0M")).toBeInTheDocument();
    const closed = screen.getByText("Closed volume").parentElement!;
    expect(within(closed).getByText("$5.0M")).toBeInTheDocument();
  });

  it("renames a column and saves", async () => {
    await renderBoard();
    const input = within(firstColumn()).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "Pipeline");
    await waitFor(() => expect(mocked.saveBoard).toHaveBeenCalled());
    const saved = mocked.saveBoard.mock.calls.at(-1)![1];
    expect(saved.columns[0].title).toBe("Pipeline");
  });

  it("adds a deal with numbers and saves", async () => {
    await renderBoard();
    const column = firstColumn();
    await userEvent.click(within(column).getByRole("button", { name: /add a deal/i }));
    await userEvent.type(within(column).getByPlaceholderText("Deal name"), "New deal");
    await userEvent.type(within(column).getByPlaceholderText("Price ($)"), "2500000");
    await userEvent.click(within(column).getByRole("button", { name: /add deal/i }));

    expect(within(column).getByText("New deal")).toBeInTheDocument();
    await waitFor(() => expect(mocked.saveBoard).toHaveBeenCalled());
    const saved = mocked.saveBoard.mock.calls.at(-1)![1];
    const added = Object.values(saved.cards).find((c) => c.title === "New deal")!;
    expect(added.price).toBe(2500000);
    expect(saved.columns[0].cardIds).toContain(added.id);
  });

  it("edits a deal", async () => {
    await renderBoard();
    await userEvent.click(screen.getByRole("button", { name: "Edit Riverbend" }));
    const capInput = screen.getByPlaceholderText("Cap rate (%)");
    await userEvent.clear(capInput);
    await userEvent.type(capInput, "6.5");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(within(screen.getByTestId("card-deal-1")).getByText("6.50%")).toBeInTheDocument();
    await waitFor(() =>
      expect(mocked.saveBoard.mock.calls.at(-1)![1].cards["deal-1"].cap_rate).toBe(6.5)
    );
  });

  it("removes a deal", async () => {
    await renderBoard();
    await userEvent.click(screen.getByRole("button", { name: "Delete Riverbend" }));
    expect(screen.queryByText("Riverbend")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(mocked.saveBoard.mock.calls.at(-1)![1].cards["deal-1"]).toBeUndefined()
    );
  });

  it("applies an AI board update without re-saving it", async () => {
    const updated = board();
    updated.columns[0].cardIds = [];
    updated.columns[2].cardIds.push("deal-1");
    mocked.chat.mockResolvedValue({ reply: "Moved Riverbend to Closed.", board: updated });

    await renderBoard();
    await userEvent.type(screen.getByLabelText("Message"), "close riverbend");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("Moved Riverbend to Closed.");
    const closed = screen.getAllByTestId(/column-/i)[2];
    expect(within(closed).getByText("Riverbend")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 500));
    expect(mocked.saveBoard).not.toHaveBeenCalled();
  });

  it("shows an error if the board fails to load", async () => {
    mocked.getBoard.mockRejectedValue(new Error("down"));
    render(<KanbanBoard boardId={1} onLogout={vi.fn()} />);
    expect(await screen.findByText("Could not load your board.")).toBeInTheDocument();
  });
});
