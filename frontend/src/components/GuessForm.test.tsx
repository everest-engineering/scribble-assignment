import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuessForm } from "./GuessForm";

describe("GuessForm", () => {
  function setInputValue(input: HTMLInputElement, value: string) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");

    if (!descriptor?.set) {
      throw new Error("Unable to set input value in test");
    }

    descriptor.set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  beforeEach(() => {
    document.body.innerHTML = "<div id=\"root\"></div>";
  });

  it("rejects blank guesses without submitting", async () => {
    const onSubmit = vi.fn();
    const container = document.getElementById("root") as HTMLElement;
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuessForm onSubmit={onSubmit} />);
    });

    const input = container.querySelector("input") as HTMLInputElement;
    const button = container.querySelector("button[type='submit']") as HTMLButtonElement;

    await act(async () => {
      setInputValue(input, "   ");
      button.click();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Guess text is required");
  });

  it("trims guesses before submitting", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const container = document.getElementById("root") as HTMLElement;
    const root = createRoot(container);

    await act(async () => {
      root.render(<GuessForm onSubmit={onSubmit} />);
    });

    const input = container.querySelector("input") as HTMLInputElement;
    const button = container.querySelector("button[type='submit']") as HTMLButtonElement;

    await act(async () => {
      setInputValue(input, "  Rocket  ");
      button.click();
    });

    expect(onSubmit).toHaveBeenCalledWith("Rocket");
  });
});
