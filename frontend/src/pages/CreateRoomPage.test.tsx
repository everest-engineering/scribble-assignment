import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateRoomPage } from "./CreateRoomPage";

vi.mock("../state/roomStore", () => ({
  useRoomState: vi.fn(() => ({ isLoading: false, error: null })),
  useRoomStore: vi.fn(() => ({ createRoom: vi.fn() }))
}));

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe("CreateRoomPage — name validation", () => {
  // T014: inline "Name cannot be empty." error
  it("shows 'Name cannot be empty.' when submitting with an empty name", async () => {
    render(<MemoryRouter><CreateRoomPage /></MemoryRouter>);

    await userEvent.click(screen.getByRole("button", { name: /create and continue/i }));

    expect(screen.getByText(/name cannot be empty\./i)).toBeTruthy();
  });

  it("shows 'Name cannot be empty.' when submitting with whitespace-only name", async () => {
    render(<MemoryRouter><CreateRoomPage /></MemoryRouter>);

    await userEvent.type(screen.getByPlaceholderText(/sketch captain/i), "   ");
    await userEvent.click(screen.getByRole("button", { name: /create and continue/i }));

    expect(screen.getByText(/name cannot be empty\./i)).toBeTruthy();
  });
});
