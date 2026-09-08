// types/engine-state.ts
// Shared TypeScript type for the Lesson Engine's StudentState as persisted
// in the engine_progress table. Mirrors src/types/state.ts in the engine repo.
// Keep in sync with engine's StudentState shape.

export interface QuizAttempt {
  attemptNumber: 1 | 2;
  score: number;
  answers: Record<string, string>;
  submittedAt: string;
}

export interface StudentState {
  studentId: string;
  topicId: string;
  currentNodeIndex: number;
  completedNodes: string[];
  quizAttempts: QuizAttempt[];
  bestQuizScore: number;
  xpEarned: number;
  topicCompleted: boolean;
  achievement: string | null;
  xpAwardedForCompletion: boolean;
}
