import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResultPanel } from "./ResultPanel";

describe("ResultPanel", () => {
  it("renders the correct word with guess history in result state", () => {
    const markup = renderToStaticMarkup(
      <ResultPanel
        correctWord="rocket"
        guesses={[
          {
            id: "g1",
            participantId: "p2",
            participantName: "Bob",
            text: "rocket",
            isCorrect: true,
            scoreDelta: 100,
            submittedAt: "2026-06-05T00:00:00.000Z"
          }
        ]}
      />
    );

    expect(markup).toContain("Correct word");
    expect(markup).toContain("rocket");
    expect(markup).toContain("Bob: rocket");
    expect(markup).toContain("+100");
  });
});
