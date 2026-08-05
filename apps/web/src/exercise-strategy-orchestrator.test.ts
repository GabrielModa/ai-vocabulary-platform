import { describe, expect, it } from "vitest";
import {
  orchestrateExerciseStrategies,
  type ExerciseStrategy,
} from "./exercise-strategy-orchestrator";

interface Context {
  readonly cloze: boolean;
  readonly definitionChoice: boolean;
}

type Publication = "cloze" | "definition-choice";

function strategy(
  strategyId: string,
  score: number,
  supports: (context: Context) => boolean,
  result:
    | { readonly ok: true; readonly publication: Publication }
    | { readonly ok: false; readonly code: string; readonly message: string },
): ExerciseStrategy<Context, Publication> {
  return { strategyId, supports, score: () => score, publish: () => result };
}

describe("exercise strategy orchestrator", () => {
  it("publishes the highest scoring supported strategy", () => {
    expect(
      orchestrateExerciseStrategies({
        context: { cloze: true, definitionChoice: true },
        strategies: [
          strategy("definition-choice", 80, ({ definitionChoice }) => definitionChoice, {
            ok: true,
            publication: "definition-choice",
          }),
          strategy("verified-cloze", 100, ({ cloze }) => cloze, {
            ok: true,
            publication: "cloze",
          }),
        ],
      }),
    ).toMatchObject({ ok: true, strategyId: "verified-cloze", publication: "cloze" });
  });

  it("falls back after publication failure", () => {
    expect(
      orchestrateExerciseStrategies({
        context: { cloze: true, definitionChoice: true },
        strategies: [
          strategy("verified-cloze", 100, () => true, {
            ok: false,
            code: "cloze-failed",
            message: "failed",
          }),
          strategy("definition-choice", 80, () => true, {
            ok: true,
            publication: "definition-choice",
          }),
        ],
      }),
    ).toMatchObject({
      ok: true,
      strategyId: "definition-choice",
      attempts: [
        { strategyId: "verified-cloze", outcome: "failed", failureCode: "cloze-failed" },
        { strategyId: "definition-choice", outcome: "published" },
      ],
    });
  });

  it("uses strategy ID to break equal scores", () => {
    expect(
      orchestrateExerciseStrategies({
        context: { cloze: true, definitionChoice: true },
        strategies: [
          strategy("verified-cloze", 100, () => true, { ok: true, publication: "cloze" }),
          strategy("definition-choice", 100, () => true, {
            ok: true,
            publication: "definition-choice",
          }),
        ],
      }),
    ).toMatchObject({ ok: true, strategyId: "definition-choice" });
  });

  it("reports no supported strategy", () => {
    expect(
      orchestrateExerciseStrategies({
        context: { cloze: false, definitionChoice: false },
        strategies: [
          strategy("verified-cloze", 100, ({ cloze }) => cloze, {
            ok: true,
            publication: "cloze",
          }),
        ],
      }),
    ).toEqual({
      ok: false,
      code: "no-supported-strategy",
      message: "No exercise strategy supports the current context",
      attempts: [],
    });
  });
});
