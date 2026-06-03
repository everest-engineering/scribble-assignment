import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuessForm } from "./GuessForm";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("GuessForm", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  async function render(props: Parameters<typeof GuessForm>[0] = {}) {
    await act(async () => {
      root.render(createElement(GuessForm, props));
      await Promise.resolve();
    });
  }

  function getInput() {
    return container.querySelector(".form__input") as HTMLInputElement;
  }

  function getSubmitButton() {
    return container.querySelector("button[type='submit']") as HTMLButtonElement;
  }

  async function type(value: string) {
    await act(async () => {
      const input = getInput();
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      setter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await Promise.resolve();
    });
  }

  async function submit() {
    await act(async () => {
      getSubmitButton().click();
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("rejects an empty submission with an inline 'Enter a guess' error and does NOT call onSubmit", async () => {
    const onSubmit = vi.fn();
    await render({ onSubmit });

    await submit();

    expect(container.textContent).toContain("Enter a guess");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only submission with the same error", async () => {
    const onSubmit = vi.fn();
    await render({ onSubmit });
    await type("   ");

    await submit();

    expect(container.textContent).toContain("Enter a guess");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the trimmed text and clears the input on success", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    await render({ onSubmit });
    await type("  rocket  ");

    await submit();

    expect(onSubmit).toHaveBeenCalledWith("rocket");
    expect(getInput().value).toBe("");
  });

  it("disables the input and button when disabled is true and does NOT submit", async () => {
    const onSubmit = vi.fn();
    await render({ disabled: true, onSubmit });
    await type("rocket");

    await submit();

    expect(getInput().disabled).toBe(true);
    expect(getSubmitButton().disabled).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
