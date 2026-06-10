import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuessForm } from "./GuessForm";

afterEach(cleanup);

describe("GuessForm", () => {
  it("renders input and submit button", () => {
    render(<GuessForm />);
    expect(screen.getByPlaceholderText("Type your guess here...")).toBeDefined();
    expect(screen.getByText("Submit Guess")).toBeDefined();
  });

  it("shows validation error for empty input on submit", async () => {
    render(<GuessForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByText("Submit Guess"));
    expect(await screen.findByText("Guess cannot be empty")).toBeDefined();
  });

  it("shows validation error for whitespace-only input", async () => {
    render(<GuessForm onSubmit={vi.fn()} />);
    const input = screen.getByPlaceholderText("Type your guess here...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByText("Submit Guess"));
    expect(await screen.findByText("Guess cannot be empty")).toBeDefined();
  });

  it("calls onSubmit with trimmed text when valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GuessForm onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText("Type your guess here...");
    fireEvent.change(input, { target: { value: "  pizza  " } });
    fireEvent.click(screen.getByText("Submit Guess"));
    expect(onSubmit).toHaveBeenCalledWith("pizza");
  });

  it("clears input after successful submission", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GuessForm onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText("Type your guess here...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "pizza" } });
    fireEvent.click(screen.getByText("Submit Guess"));
    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("disables input and button when disabled prop is true", () => {
    render(<GuessForm disabled />);
    expect(screen.getByPlaceholderText("Type your guess here...")).toBeDisabled();
    expect(screen.getByText("Submit Guess")).toBeDisabled();
  });

  it("shows disabledReason when provided", () => {
    render(<GuessForm disabled disabledReason="You already guessed correctly!" />);
    expect(screen.getByText("You already guessed correctly!")).toBeDefined();
  });

  it("displays server error from onSubmit rejection", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Drawers cannot guess"));
    render(<GuessForm onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText("Type your guess here...");
    fireEvent.change(input, { target: { value: "pizza" } });
    fireEvent.click(screen.getByText("Submit Guess"));
    expect(await screen.findByText("Drawers cannot guess")).toBeDefined();
  });
});
