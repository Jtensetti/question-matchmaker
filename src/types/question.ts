
export interface Question {
  id: string;
  text: string;
  answer: string; // We'll keep this as string for database storage
  createdAt: Date;
  similarityThreshold?: number;
  semanticMatching?: boolean;
  teacherId?: string;
  questionType?: string;
  options?: string[];
  gridRows?: string[];
  gridColumns?: string[];
  ratingMin?: number;
  ratingMax?: number;
}

export interface StudentAnswer {
  id: string;
  questionId: string;
  studentName: string;
  answer: string;
  submittedAt: Date;
  isCorrect: boolean;
  testId?: string;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  questions?: Question[];
  teacherId?: string;
}

// New type definitions for strongly typed question answers
export type RatingAnswer = number;
export type MultipleChoiceAnswer = string;
export type TextAnswer = string;
export type GridAnswer = { row: string; column: string };

// Union type for all possible answer types
export type QuestionAnswer = RatingAnswer | MultipleChoiceAnswer | TextAnswer | GridAnswer;
