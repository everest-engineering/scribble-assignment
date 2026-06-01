import { describe, it, expect } from "vitest";
import { isValidRoomCode, roomCodeErrorMessage } from "./validation";

describe("room code validation", () => {
  it("accepts 4-char alphanumeric codes (case-insensitive)", () => {
    expect(isValidRoomCode("ABCD")).toBe(true);
    expect(isValidRoomCode("ab12")).toBe(true);
    expect(isValidRoomCode("  aB12 ")).toBe(true);
  });

  it("rejects codes with invalid characters", () => {
    expect(isValidRoomCode("A B#")).toBe(false);
    expect(roomCodeErrorMessage("A B#")).toBe(
      "Room code may only contain letters and numbers."
    );
  });

  it("rejects codes with wrong length", () => {
    expect(isValidRoomCode("ABC")).toBe(false);
    expect(roomCodeErrorMessage("ABC")).toBe("Room code must be 4 characters.");
    expect(isValidRoomCode("ABCDE")).toBe(false);
    expect(roomCodeErrorMessage("ABCDE")).toBe(
      "Room code must be 4 characters."
    );
  });

  it("returns empty message for blank input", () => {
    expect(roomCodeErrorMessage("")).toBe("");
    expect(roomCodeErrorMessage("   ")).toBe("");
  });
});
