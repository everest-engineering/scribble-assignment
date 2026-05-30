import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema, joinRoomSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName and trims it", () => {
    const result = createRoomSchema.parse({ playerName: " Alice " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty or whitespace-only name", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
    expect(() => createRoomSchema.parse({})).toThrow();
  });

  it("joinRoomSchema rejects empty or whitespace-only name", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
    expect(() => joinRoomSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects missing or empty code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });
});
