import { expect, test, type Page } from "@playwright/test";

const signIn = async (page: Page) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  // The login page shares the heading, so wait for something only the signed-in view has.
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
};

const dragCard = async (page: Page, cardTestId: string, columnTestId: string) => {
  const card = page.getByTestId(cardTestId);
  const column = page.getByTestId(columnTestId);
  const cardBox = await card.boundingBox();
  const columnBox = await column.boundingBox();
  if (!cardBox || !columnBox) throw new Error("Unable to resolve drag coordinates.");
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + 20);
  await page.mouse.down();
  await page.mouse.move(columnBox.x + columnBox.width / 2, columnBox.y + 200, { steps: 15 });
  await page.mouse.up();
  // Let the drop animation finish so the next drag grabs the right card.
  await page.waitForTimeout(400);
};

test.beforeEach(async ({ request }) => {
  // Reset the board to the default so tests are independent.
  await request.post("/api/auth/login", { data: { username: "user", password: "password" } });
  const boards = await (await request.get("/api/boards")).json();
  for (const b of boards.slice(1)) await request.delete(`/api/boards/${b.id}`);
  const board = await (await request.get("/api/board")).json();
  board.columns.forEach((c: { cardIds: string[] }) => (c.cardIds = []));
  const ids = ["deal-1", "deal-2", "deal-3", "deal-4", "deal-5", "deal-6", "deal-7", "deal-8"];
  const layout = [["deal-1", "deal-2"], ["deal-3", "deal-4"], ["deal-5"], ["deal-6"], ["deal-7", "deal-8"]];
  board.cards = Object.fromEntries(Object.entries(board.cards).filter(([id]) => ids.includes(id)));
  layout.forEach((cardIds, i) => (board.columns[i].cardIds = cardIds.filter((id) => board.cards[id])));
  const titles = ["Sourcing", "Underwriting", "LOI", "Due Diligence", "Closed"];
  board.columns.forEach((c: { title: string }, i: number) => (c.title = titles[i]));
  await request.put("/api/board", { data: board });
});

test("requires sign in and rejects bad credentials", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid username or password.")).toBeVisible();
});

test("shows the pipeline and logs out", async ({ page }) => {
  await signIn(page);
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);
  await expect(page.getByText("Riverbend Logistics Center")).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("drag and drop persists across sign out", async ({ page }) => {
  await signIn(page);
  await dragCard(page, "card-deal-1", "column-col-closed");
  await expect(page.getByTestId("column-col-closed").getByTestId("card-deal-1")).toBeVisible();
  await expect(page.getByText("All changes saved")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await signIn(page);
  await expect(page.getByTestId("column-col-closed").getByTestId("card-deal-1")).toBeVisible();
});

test("repeated drags all stick", async ({ page }) => {
  await signIn(page);
  await dragCard(page, "card-deal-3", "column-col-loi");
  await expect(page.getByTestId("column-col-loi").getByTestId("card-deal-3")).toBeVisible();
  await dragCard(page, "card-deal-3", "column-col-diligence");
  await expect(page.getByTestId("column-col-diligence").getByTestId("card-deal-3")).toBeVisible();
  await dragCard(page, "card-deal-2", "column-col-underwriting");
  await expect(page.getByTestId("column-col-underwriting").getByTestId("card-deal-2")).toBeVisible();
});

test("AI analyst panel hides and reopens", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Hide AI analyst" }).click();
  await expect(page.getByLabel("Message")).toBeHidden();
  await page.getByRole("button", { name: "AI Analyst" }).click();
  await expect(page.getByLabel("Message")).toBeVisible();
});

test("all five columns fit on a laptop screen with the analyst open", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  const closed = await page.getByTestId("column-col-closed").boundingBox();
  const sidebar = await page.getByLabel("AI analyst", { exact: true }).boundingBox();
  expect(closed!.x + closed!.width).toBeLessThanOrEqual(sidebar!.x);
});

test("add, edit and rename persist after reload", async ({ page }) => {
  await signIn(page);
  const sourcing = page.getByTestId("column-col-sourcing");
  await sourcing.getByRole("button", { name: "Add a deal" }).click();
  await sourcing.getByPlaceholder("Deal name").fill("Lakeview Industrial");
  await sourcing.getByPlaceholder("Price ($)").fill("12000000");
  await sourcing.getByPlaceholder("Cap rate (%)").fill("6.75");
  await sourcing.getByRole("button", { name: "Add deal" }).click();
  await expect(sourcing.getByText("Lakeview Industrial")).toBeVisible();

  await page.getByRole("button", { name: "Edit Magazine St Retail Strip", exact: true }).click();
  await page.getByPlaceholder("Market").fill("Metairie");
  await page.getByRole("button", { name: "Save" }).click();

  const title = page.getByTestId("column-col-loi").getByLabel("Column title");
  await title.fill("Letter of Intent");
  await expect(page.getByText("All changes saved")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Lakeview Industrial")).toBeVisible();
  await expect(page.getByText("Retail / Metairie")).toBeVisible();
  await expect(page.getByTestId("column-col-loi").getByLabel("Column title")).toHaveValue("Letter of Intent");
});

const signUp = async (page: Page, username: string, password = "pipeline1") => {
  await page.goto("/");
  await page.getByRole("button", { name: /create an account/i }).click();
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  // The login page shares the heading, so wait for something only the signed-in view has.
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
};

const uniqueName = (prefix: string) => `${prefix}${Date.now().toString(36)}`;

test("sign up, sign out and sign back in", async ({ page }) => {
  const name = uniqueName("e2e");
  await signUp(page, name);
  await expect(page.getByRole("button", { name: "Account", exact: true })).toContainText(name);
  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByLabel("Username").fill(name);
  await page.getByLabel("Password").fill("pipeline1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Riverbend Logistics Center")).toBeVisible();
});

test("multiple pipelines keep their own deals", async ({ page }) => {
  await signUp(page, uniqueName("multi"));
  await page.getByRole("button", { name: "New pipeline" }).click();
  await page.getByLabel("Pipeline name").fill("Data Center Fund");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Riverbend Logistics Center")).toBeHidden();

  const sourcing = page.getByTestId("column-col-sourcing");
  await sourcing.getByRole("button", { name: "Add a deal" }).click();
  await sourcing.getByPlaceholder("Deal name").fill("Ashburn Powered Land");
  await sourcing.getByRole("button", { name: "Add deal" }).click();
  await expect(page.getByText("All changes saved")).toBeVisible();

  await page.getByLabel("Pipeline", { exact: true }).selectOption({ label: "Acquisitions Pipeline (8)" });
  await expect(page.getByText("Riverbend Logistics Center")).toBeVisible();
  await expect(page.getByText("Ashburn Powered Land")).toBeHidden();

  await page.getByLabel("Pipeline", { exact: true }).selectOption({ label: "Data Center Fund (1)" });
  await expect(page.getByText("Ashburn Powered Land")).toBeVisible();

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete pipeline" }).click();
  await expect(page.getByText("Riverbend Logistics Center")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete pipeline" })).toBeDisabled();
});

test("change password and delete account", async ({ page }) => {
  const name = uniqueName("acct");
  await signUp(page, name, "firstpass1");
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await page.getByLabel("Current password").fill("firstpass1");
  await page.getByLabel("New password").fill("secondpass2");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText(/Password updated/)).toBeVisible();

  await page.getByLabel("Confirm password").fill("secondpass2");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Username").fill(name);
  await page.getByLabel("Password").fill("secondpass2");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid username or password.")).toBeVisible();
});
