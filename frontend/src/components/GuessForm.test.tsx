import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GuessForm } from "./GuessForm";

describe("GuessForm", () => {
  it("renders input and submit button", () => {
    render(<GuessForm />);

    expect(screen.getByPlaceholderText(/type your guess/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit guess/i })).toBeInTheDocument();
  });

  it("disables input and button when disabled is true", () => {
    render(<GuessForm disabled={true} />);

    expect(screen.getByPlaceholderText(/type your guess/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /submit guess/i })).toBeDisabled();
  });
});
