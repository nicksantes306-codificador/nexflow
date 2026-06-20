import { test, expect } from "@playwright/test";

test("tela de login renderiza marca e formulário", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "NEXFLOW" })).toBeVisible();
  await expect(page.getByPlaceholder("voce@empresa.com.br")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});

test("usuário não autenticado é redirecionado para /login", async ({ page }) => {
  await page.goto("/crm");
  await expect(page).toHaveURL(/\/login/);
});

test("alternância entre entrar e cadastrar", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Cadastre-se/ }).click();
  await expect(page.getByPlaceholder("Sua empresa")).toBeVisible();
});
