import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/LoginForm";
import { api, ApiError } from "@/lib/api";

vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  api: { login: vi.fn(), register: vi.fn() },
}));
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
    expect(onSuccess).toHaveBeenCalledWith("user");
  });

  it("shows an error for bad credentials", async () => {
    mocked.login.mockRejectedValue(new Error("401"));
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    await fill("user", "wrong");
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password.");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("creates an account in sign-up mode", async () => {
    mocked.register.mockResolvedValue({ username: "darby" });
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    await userEvent.click(screen.getByRole("button", { name: /create an account/i }));
    await userEvent.type(screen.getByLabelText("Username"), "darby");
    await userEvent.type(screen.getByLabelText("Password"), "dealflow1");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(mocked.register).toHaveBeenCalledWith("darby", "dealflow1");
    expect(onSuccess).toHaveBeenCalledWith("darby");
  });

  it("shows the server's reason when sign-up fails", async () => {
    mocked.register.mockRejectedValue(new ApiError(400, "That username is taken"));
    render(<LoginForm onSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /create an account/i }));
    await userEvent.type(screen.getByLabelText("Username"), "user");
    await userEvent.type(screen.getByLabelText("Password"), "longenough");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That username is taken");
  });
});
