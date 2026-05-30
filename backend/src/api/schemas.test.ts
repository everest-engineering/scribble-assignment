import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims playerName", () => {
    const result = createRoomSchema.parse({ playerName: " Alice " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty and whitespace-only names", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema rejects empty and whitespace-only names", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema trims playerName", () => {
    const result = joinRoomSchema.parse({ playerName: " Bob " });

    expect(result.playerName).toBe("Bob");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects empty and whitespace-only codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });

  it("roomCodeParamsSchema accepts trimmed non-empty codes", () => {
    const result = roomCodeParamsSchema.parse({ code: " abcd " });

    expect(result.code).toBe("abcd");
  });
});
