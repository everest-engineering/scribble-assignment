import { describe, expect, it } from "vitest";
import { canvasActionSchema, createRoomSchema, guessSubmissionSchema, joinRoomSchema, playerNameSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  describe("playerNameSchema", () => {
    const validNames = ["Alice", "Bob-123", "hello world", "test_name", "a", "A".repeat(15)];
    for (const name of validNames) {
      it(`accepts "${name}"`, () => {
        expect(playerNameSchema.parse(name)).toBe(name);
      });
    }

    const invalidNames = ["", "  ", "@lice", "name!with", "a🐱b", "toolongname12345!"];
    for (const name of invalidNames) {
      it(`rejects "${name}"`, () => {
        expect(() => playerNameSchema.parse(name)).toThrow();
      });
    }

    it("trims whitespace", () => {
      expect(playerNameSchema.parse("  Alice  ")).toBe("Alice");
    });

    it("rejects name over 15 chars", () => {
      expect(() => playerNameSchema.parse("A".repeat(16))).toThrow();
    });
  });

  describe("createRoomSchema", () => {
    it("accepts a valid body with playerName", () => {
      const result = createRoomSchema.parse({ playerName: "Alice" });
      expect(result.playerName).toBe("Alice");
    });

    it("accepts missing playerName", () => {
      const result = createRoomSchema.parse({});
      expect(result.playerName).toBeUndefined();
    });

    it("rejects invalid playerName", () => {
      expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    });
  });

  describe("joinRoomSchema", () => {
    it("accepts a valid body with playerName", () => {
      const result = joinRoomSchema.parse({ playerName: "Bob" });
      expect(result.playerName).toBe("Bob");
    });

    it("accepts missing playerName", () => {
      const result = joinRoomSchema.parse({});
      expect(result.playerName).toBeUndefined();
    });

    it("rejects invalid playerName", () => {
      expect(() => joinRoomSchema.parse({ playerName: "@bad" })).toThrow();
    });
  });

  describe("roomCodeParamsSchema", () => {
    it("accepts a valid 4-char uppercase code", () => {
      const result = roomCodeParamsSchema.parse({ code: "ABCD" });
      expect(result.code).toBe("ABCD");
    });

    it("rejects missing code", () => {
      expect(() => roomCodeParamsSchema.parse({})).toThrow();
    });

    it("rejects short code", () => {
      expect(() => roomCodeParamsSchema.parse({ code: "AB" })).toThrow();
    });
  });

  describe("canvasActionSchema", () => {
    it("accepts a valid stroke action", () => {
      const result = canvasActionSchema.parse({
        type: "stroke",
        points: [{ x: 10, y: 20 }, { x: 30, y: 40 }],
        color: "#000000",
        width: 3
      }) as { type: "stroke"; points: { x: number; y: number }[]; color: string; width: number };
      expect(result.type).toBe("stroke");
      expect(result.points).toHaveLength(2);
    });

    it("accepts a valid clear action", () => {
      const result = canvasActionSchema.parse({ type: "clear" });
      expect(result.type).toBe("clear");
    });

    it("rejects stroke with empty points array", () => {
      expect(() =>
        canvasActionSchema.parse({ type: "stroke", points: [], color: "#000", width: 3 })
      ).toThrow();
    });

    it("rejects stroke with missing color", () => {
      expect(() =>
        canvasActionSchema.parse({ type: "stroke", points: [{ x: 1, y: 2 }], width: 3 })
      ).toThrow();
    });

    it("rejects stroke with non-positive width", () => {
      expect(() =>
        canvasActionSchema.parse({ type: "stroke", points: [{ x: 1, y: 2 }], color: "#000", width: 0 })
      ).toThrow();
    });

    it("rejects unknown action type", () => {
      expect(() =>
        canvasActionSchema.parse({ type: "erase" })
      ).toThrow();
    });

    it("rejects if type is missing", () => {
      expect(() =>
        canvasActionSchema.parse({ points: [{ x: 1, y: 2 }] })
      ).toThrow();
    });
  });

  describe("guessSubmissionSchema", () => {
    it("accepts a valid guess", () => {
      const result = guessSubmissionSchema.parse({ text: "hello" });
      expect(result.text).toBe("hello");
    });

    it("trims whitespace from guess", () => {
      const result = guessSubmissionSchema.parse({ text: "  hello  " });
      expect(result.text).toBe("hello");
    });

    it("rejects empty guess", () => {
      expect(() => guessSubmissionSchema.parse({ text: "" })).toThrow("Guess cannot be empty");
    });

    it("rejects whitespace-only guess", () => {
      expect(() => guessSubmissionSchema.parse({ text: "   " })).toThrow("Guess cannot be empty");
    });

    it("rejects guess exceeding 100 characters", () => {
      expect(() => guessSubmissionSchema.parse({ text: "a".repeat(101) })).toThrow("Guess cannot exceed 100 characters");
    });
  });
});
