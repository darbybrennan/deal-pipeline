import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatSidebar } from "@/components/ChatSidebar";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({ api: { chat: vi.fn() } }));
const mocked = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

describe("ChatSidebar", () => {
  it("sends a message and shows the reply", async () => {
    mocked.chat.mockResolvedValue({ reply: "You have 8 deals.", board: null });
    const onBoardUpdate = vi.fn();
    render(<ChatSidebar onBoardUpdate={onBoardUpdate} />);

    await userEvent.type(screen.getByLabelText("Message"), "How many deals?");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("You have 8 deals.")).toBeInTheDocument();
    expect(screen.getByText("How many deals?")).toBeInTheDocument();
    expect(mocked.chat).toHaveBeenCalledWith("How many deals?", []);
    expect(onBoardUpdate).not.toHaveBeenCalled();
  });

  it("sends conversation history on follow-ups", async () => {
    mocked.chat.mockResolvedValueOnce({ reply: "First", board: null });
    mocked.chat.mockResolvedValueOnce({ reply: "Second", board: null });
    render(<ChatSidebar onBoardUpdate={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Message"), "one");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("First");
    await userEvent.type(screen.getByLabelText("Message"), "two");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Second");

    expect(mocked.chat).toHaveBeenLastCalledWith("two", [
      { role: "user", content: "one" },
      { role: "assistant", content: "First" },
    ]);
  });

  it("suggestion buttons send immediately", async () => {
    mocked.chat.mockResolvedValue({ reply: "Summary", board: null });
    render(<ChatSidebar onBoardUpdate={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Summarize my pipeline" }));
    expect(await screen.findByText("Summary")).toBeInTheDocument();
  });

  it("shows an error when the AI fails", async () => {
    mocked.chat.mockRejectedValue(new Error("502"));
    render(<ChatSidebar onBoardUpdate={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Message"), "hi");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't respond/i);
  });
});
