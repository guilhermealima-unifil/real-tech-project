import { describe, expect, it } from "vitest";
import {
  DURACAO_TOAST_MS,
  LIMITE_TOASTS_VISIVEIS,
  toastReducer,
  type ToastItem,
} from "./toast";

function toast(id: string): ToastItem {
  return {
    id,
    variant: "success",
    title: `Toast ${id}`,
    durationMs: DURACAO_TOAST_MS.success,
  };
}

describe("toastReducer", () => {
  it("mantém somente os toasts mais recentes dentro do limite visível", () => {
    const estado = ["1", "2", "3", "4"].reduce<ToastItem[]>(
      (atual, id) => toastReducer(atual, { type: "ADICIONAR", toast: toast(id) }),
      [],
    );

    expect(estado).toHaveLength(LIMITE_TOASTS_VISIVEIS);
    expect(estado.map((item) => item.id)).toEqual(["2", "3", "4"]);
  });

  it("remove somente o toast identificado", () => {
    const estado = [toast("1"), toast("2"), toast("3")];

    expect(toastReducer(estado, { type: "REMOVER", id: "2" })).toEqual([
      toast("1"),
      toast("3"),
    ]);
  });

  it("ignora com segurança a remoção de um ID inexistente", () => {
    const estado = [toast("1")];

    expect(toastReducer(estado, { type: "REMOVER", id: "inexistente" })).toEqual(estado);
  });
});
