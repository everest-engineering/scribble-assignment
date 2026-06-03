import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuessForm } from "./GuessForm";

afterEach(cleanup);

// T032: GuessForm tests
describe("GuessForm", () => {
  it("renders an input and submit button when isDrawer is false", () => {
    render(<GuessForm isDrawer={false} disabled={false} onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText(/type your guess/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /submit guess/i })).toBeTruthy();
  });

  it("does not render the form when isDrawer is true", () => {
    render(<GuessForm isDrawer={true} disabled={false} onSubmit={vi.fn()} />);
    expect(screen.queryByPlaceholderText(/type your guess/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /submit guess/i })).toBeNull();
  });

  it("calls onSubmit with trimmed text when form is submitted with non-empty input", () => {
    const onSubmit = vi.fn();
    render(<GuessForm isDrawer={false} disabled={false} onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText(/type your guess/i);
    fireEvent.change(input, { target: { value: "  rocket  " } });
    fireEvent.submit(input.closest("form")!);
    expect(onSubmit).toHaveBeenCalledWith("rocket");
  });

  it("does not call onSubmit when input is empty", () => {
    const onSubmit = vi.fn();
    render(<GuessForm isDrawer={false} disabled={false} onSubmit={onSubmit} />);
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("input and button are disabled when disabled prop is true", () => {
    render(<GuessForm isDrawer={false} disabled={true} onSubmit={vi.fn()} />);
    expect((screen.getByPlaceholderText(/type your guess/i) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /submit guess/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("clears the input after a successful submission", () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GuessForm isDrawer={false} disabled={false} onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText(/type your guess/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "rocket" } });
    fireEvent.submit(input.closest("form")!);
    expect(input.value).toBe("");
  });
});
