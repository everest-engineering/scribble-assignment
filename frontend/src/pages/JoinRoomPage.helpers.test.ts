import { describe, expect, it } from "vitest";
import { isJoinFormValid } from "./JoinRoomPage";

describe("isJoinFormValid", () => {
  it("returns false when either field is empty/whitespace", () => {
    expect(isJoinFormValid("", "ABCD")).toBe(false);
    expect(isJoinFormValid("   ", "ABCD")).toBe(false);
    expect(isJoinFormValid("Alice", "")).toBe(false);
    expect(isJoinFormValid("Alice", "   ")).toBe(false);
  });

  it("returns true when both fields have trimmed content", () => {
    expect(isJoinFormValid("Alice", "ABCD")).toBe(true);
    expect(isJoinFormValid("  Alice  ", "  abcd  ")).toBe(true);
  });
});
