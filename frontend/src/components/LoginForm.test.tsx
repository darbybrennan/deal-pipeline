import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/LoginForm";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({ api: { login: vi.fn() } }));
const mocked = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());

const fill = async (user: string, pass: string) => {
  await userEvent.type(screen.getByLabelText("Username"), user);
  await userEvent.type(screen.getByLabelText("Password"), pass);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
};

describe("LoginForm", () => {
  it("signs in with valid credentials", async () => {
    mocked.login.mockResolvedValue({ username: "user" });
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    await fill("user", "password");
    expect(mocked.login).toHaveBeenCalledWith("user", "password");
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows an error for bad credentials", async () => {
    mocked.login.mockRejectedValue(new Error("401"));
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    await fill("user", "wrong");
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password.");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
