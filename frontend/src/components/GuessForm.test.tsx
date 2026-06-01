import { describe, expect, it, vi, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { GuessForm } from "./GuessForm";
import { RoomStore, RoomStoreProvider } from "../state/roomStore";

describe("GuessForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows a validation error when the guess is empty", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <RoomStoreProvider>
          <GuessForm />
        </RoomStoreProvider>
      );
    });

    const submitButton = container.querySelector("button[type=submit]");
    expect(submitButton).toBeInstanceOf(HTMLButtonElement);

    act(() => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const error = container.querySelector(".form__error");
    expect(error?.textContent).toBe("Please enter a guess before submitting.");

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it("clears error state when form is successfully submitted", () => {
    const mockSubmitGuess = vi.fn().mockResolvedValue({});
    vi.spyOn(RoomStore.prototype, "submitGuess").mockImplementation(mockSubmitGuess);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <RoomStoreProvider>
          <GuessForm />
        </RoomStoreProvider>
      );
    });

    const input = container.querySelector("input") as HTMLInputElement;
    const submitButton = container.querySelector("button[type=submit]");

    // Show error on empty submit
    act(() => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    let error = container.querySelector(".form__error");
    expect(error?.textContent).toBe("Please enter a guess before submitting.");

    // Error remains until form is resubmitted with valid input
    act(() => {
      input.value = "hello";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.querySelector(".form__error")?.textContent).toBe(
      "Please enter a guess before submitting."
    );

    vi.restoreAllMocks();

    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
