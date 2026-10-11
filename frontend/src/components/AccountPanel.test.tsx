import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountPanel } from "@/components/AccountPanel";
import { api, ApiError } from "@/lib/api";

vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  api: { changePassword: vi.fn(), deleteAccount: vi.fn() },
}));
const mocked = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

describe("AccountPanel", () => {
  it("changes the password", async () => {
    mocked.changePassword.mockResolvedValue({ ok: true });
    render(<AccountPanel username="darby" onClose={vi.fn()} onDeleted={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Current password"), "oldpassword");
    await userEvent.type(screen.getByLabelText("New password"), "newpassword");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(mocked.changePassword).toHaveBeenCalledWith("oldpassword", "newpassword");
    expect(await screen.findByText(/Password updated/)).toBeInTheDocument();
  });

  it("shows the server error for a wrong password", async () => {
    mocked.deleteAccount.mockRejectedValue(new ApiError(400, "Password is incorrect"));
    const onDeleted = vi.fn();
    render(<AccountPanel username="darby" onClose={vi.fn()} onDeleted={onDeleted} />);
    await userEvent.type(screen.getByLabelText("Confirm password"), "nope");
    await userEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Password is incorrect");
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("calls onDeleted after deleting", async () => {
    mocked.deleteAccount.mockResolvedValue({ ok: true });
    const onDeleted = vi.fn();
    render(<AccountPanel username="darby" onClose={vi.fn()} onDeleted={onDeleted} />);
    await userEvent.type(screen.getByLabelText("Confirm password"), "pipeline1");
    await userEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    expect(onDeleted).toHaveBeenCalled();
  });
});
