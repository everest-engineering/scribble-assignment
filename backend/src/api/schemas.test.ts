import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameBodySchema,
  guessBodySchema,
  drawBodySchema,
  clearDrawBodySchema,
  restartBodySchema,
  endRoundBodySchema
} from "./schemas.js";

describe("createRoomSchema", () => {
  it("accepts a valid playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });
    expect(result.playerName).toBe("Alice");
  });

  it("accepts playerName with whitespace (trims it)", () => {
    const result = createRoomSchema.parse({ playerName: "  Bob  " });
    expect(result.playerName).toBe("Bob");
  });

  it("rejects empty playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("rejects whitespace-only playerName after trim", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("rejects missing playerName", () => {
    expect(() => createRoomSchema.parse({})).toThrow();
  });
});

describe("joinRoomSchema", () => {
  it("accepts a valid playerName", () => {
    const result = joinRoomSchema.parse({ playerName: "Charlie" });
    expect(result.playerName).toBe("Charlie");
  });

  it("trims playerName", () => {
    const result = joinRoomSchema.parse({ playerName: "  Dave  " });
    expect(result.playerName).toBe("Dave");
  });

  it("rejects empty playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("rejects whitespace-only playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });
});

describe("roomCodeParamsSchema", () => {
  it("accepts a valid room code", () => {
    const result = roomCodeParamsSchema.parse({ code: "ABCD" });
    expect(result.code).toBe("ABCD");
  });

  it("rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("rejects empty code", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
  });
});

describe("roomViewerQuerySchema", () => {
  it("accepts optional participantId", () => {
    const result = roomViewerQuerySchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
  });

  it("accepts missing participantId", () => {
    const result = roomViewerQuerySchema.parse({});
    expect(result.participantId).toBeUndefined();
  });
});

describe("startGameBodySchema", () => {
  it("accepts a valid participantId", () => {
    const result = startGameBodySchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
  });

  it("rejects empty participantId", () => {
    expect(() => startGameBodySchema.parse({ participantId: "" })).toThrow();
  });

  it("rejects missing participantId", () => {
    expect(() => startGameBodySchema.parse({})).toThrow();
  });
});

describe("guessBodySchema", () => {
  it("accepts valid participantId and text", () => {
    const result = guessBodySchema.parse({ participantId: "p1", text: "pizza" });
    expect(result.text).toBe("pizza");
  });

  it("trims whitespace from guess text", () => {
    const result = guessBodySchema.parse({ participantId: "p1", text: "  pizza  " });
    expect(result.text).toBe("pizza");
  });

  it("rejects empty guess", () => {
    expect(() => guessBodySchema.parse({ participantId: "p1", text: "" })).toThrow();
  });

  it("rejects whitespace-only guess", () => {
    expect(() => guessBodySchema.parse({ participantId: "p1", text: "   " })).toThrow();
  });

  it("rejects missing participantId", () => {
    expect(() => guessBodySchema.parse({ text: "pizza" })).toThrow();
  });

  it("rejects missing text", () => {
    expect(() => guessBodySchema.parse({ participantId: "p1" })).toThrow();
  });
});

describe("drawBodySchema", () => {
  it("accepts valid participantId and drawingData", () => {
    const result = drawBodySchema.parse({
      participantId: "p1",
      drawingData: "data:image/png;base64,abc"
    });
    expect(result.drawingData).toBe("data:image/png;base64,abc");
  });

  it("rejects missing participantId", () => {
    expect(() => drawBodySchema.parse({ drawingData: "abc" })).toThrow();
  });

  it("rejects missing drawingData", () => {
    expect(() => drawBodySchema.parse({ participantId: "p1" })).toThrow();
  });
});

describe("clearDrawBodySchema", () => {
  it("accepts valid participantId", () => {
    const result = clearDrawBodySchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
  });

  it("rejects empty participantId", () => {
    expect(() => clearDrawBodySchema.parse({ participantId: "" })).toThrow();
  });

  it("rejects missing participantId", () => {
    expect(() => clearDrawBodySchema.parse({})).toThrow();
  });
});

describe("restartBodySchema", () => {
  it("accepts valid participantId", () => {
    const result = restartBodySchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
  });

  it("rejects empty participantId", () => {
    expect(() => restartBodySchema.parse({ participantId: "" })).toThrow();
  });

  it("rejects missing participantId", () => {
    expect(() => restartBodySchema.parse({})).toThrow();
  });
});

describe("endRoundBodySchema", () => {
  it("accepts valid participantId", () => {
    const result = endRoundBodySchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
  });

  it("rejects empty participantId", () => {
    expect(() => endRoundBodySchema.parse({ participantId: "" })).toThrow();
  });

  it("rejects missing participantId", () => {
    expect(() => endRoundBodySchema.parse({})).toThrow();
  });
});
