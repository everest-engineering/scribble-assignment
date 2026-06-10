import { describe, expect, it } from "vitest";
import { isCreateFormValid, PLAYER_NAME_MAX } from "./CreateRoomPage";

describe("isCreateFormValid", () => {
  it.each(["", "   ", "\t\n"])("returns false for empty/whitespace-only: %j", (value) => {
    expect(isCreateFormValid(value)).toBe(false);
  });

  it.each(["A", "Alice", "  Alice  "])("returns true for trimmed non-empty: %j", (value) => {
    expect(isCreateFormValid(value)).toBe(true);
  });

  it("returns false when the trimmed name exceeds the max length", () => {
    expect(isCreateFormValid("x".repeat(PLAYER_NAME_MAX + 1))).toBe(false);
  });

  it("returns true at the max length", () => {
    expect(isCreateFormValid("x".repeat(PLAYER_NAME_MAX))).toBe(true);
  });
});
