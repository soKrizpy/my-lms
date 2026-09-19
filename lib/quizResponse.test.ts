import { describe, expect, it } from "vitest";
import { getQuizQuestions } from "./quizResponse";

type Question = { id: number; question_text: string };

const questions: Question[] = [
  { id: 1, question_text: "What is a variable?" },
];

describe("getQuizQuestions", () => {
  it("accepts the legacy question-array response", () => {
    expect(getQuizQuestions<Question>(questions)).toEqual(questions);
  });

  it("accepts the current quiz metadata envelope", () => {
    expect(getQuizQuestions<Question>({
      quiz: { id: 7, title: "Variables" },
      attempt: { attemptsCount: 0, score: 0 },
      questions,
    })).toEqual(questions);
  });

  it("returns an empty array for malformed payloads", () => {
    expect(getQuizQuestions<Question>({ questions: "invalid" })).toEqual([]);
    expect(getQuizQuestions<Question>(null)).toEqual([]);
  });
});
