import { describe, expect, it } from "vitest";
import { leaveRoomSchema, roomCodeParamsSchema, startRoomSchema } from "./schemas.js";

describe("schemas", () => {
  it("rejects empty and whitespace-only room codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });

  it("rejects invalid room codes and normalizes valid codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "abc" })).toThrow();
    expect(roomCodeParamsSchema.parse({ code: "abcd" })).toEqual({ code: "ABCD" });
  });

  it("requires a participant id for start and leave actions", () => {
    expect(() => startRoomSchema.parse({})).toThrow();
    expect(() => leaveRoomSchema.parse({ participantId: "" })).toThrow();
  });
});
