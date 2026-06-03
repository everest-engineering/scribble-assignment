import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });
    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims playerName and rejects empty strings", () => {
    const result = createRoomSchema.parse({ playerName: "  Bob  " });
    expect(result.playerName).toBe("Bob");

    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Name cannot be empty");
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow("Name cannot be empty");
  });

  it("createRoomSchema rejects names longer than 20 characters", () => {
    expect(() => createRoomSchema.parse({ playerName: "ThisNameIsWayTooLongToBeValid" })).toThrow("Name cannot exceed 20 characters");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema validates 6-character alphanumeric codes", () => {
    expect(roomCodeParamsSchema.parse({ code: "A1B2C3" }).code).toBe("A1B2C3");
    
    expect(() => roomCodeParamsSchema.parse({ code: "A1B2C" })).toThrow("Room code must be exactly 6 alphanumeric characters");
    expect(() => roomCodeParamsSchema.parse({ code: "A1B2C3D" })).toThrow("Room code must be exactly 6 alphanumeric characters");
    expect(() => roomCodeParamsSchema.parse({ code: "A1B-C3" })).toThrow("Room code must be exactly 6 alphanumeric characters");
  });
});
