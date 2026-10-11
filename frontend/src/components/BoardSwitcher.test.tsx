import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardSwitcher } from "@/components/BoardSwitcher";

const boards = [
  { id: 1, title: "Acquisitions Pipeline", deals: 8 },
  { id: 2, title: "Fund II", deals: 0 },
];

const setup = (list = boards) => {
  const handlers = { onSelect: vi.fn(), onCreate: vi.fn(), onRename: vi.fn(), onDelete: vi.fn() };
  render(<BoardSwitcher boards={list} activeId={1} {...handlers} />);
  return handlers;
};

describe("BoardSwitcher", () => {
  it("switches pipelines", async () => {
    const h = setup();
    await userEvent.selectOptions(screen.getByLabelText("Pipeline"), "2");
    expect(h.onSelect).toHaveBeenCalledWith(2);
  });

  it("creates a pipeline", async () => {
    const h = setup();
    await userEvent.click(screen.getByRole("button", { name: "New pipeline" }));
    await userEvent.type(screen.getByLabelText("Pipeline name"), "Data Centers");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(h.onCreate).toHaveBeenCalledWith("Data Centers");
  });

  it("renames the active pipeline", async () => {
    const h = setup();
    await userEvent.click(screen.getByRole("button", { name: "Rename pipeline" }));
    const input = screen.getByLabelText("Pipeline name");
    expect(input).toHaveValue("Acquisitions Pipeline");
    await userEvent.clear(input);
    await userEvent.type(input, "Core");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(h.onRename).toHaveBeenCalledWith(1, "Core");
  });

  it("deletes after confirming, and not the last one", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const h = setup();
    await userEvent.click(screen.getByRole("button", { name: "Delete pipeline" }));
    expect(h.onDelete).toHaveBeenCalledWith(1);
  });

  it("disables delete when only one pipeline exists", () => {
    setup([boards[0]]);
    expect(screen.getByRole("button", { name: "Delete pipeline" })).toBeDisabled();
  });
});
