
export interface Question {
  id: string;
  text: string;
  answer: string;
  createdAt: Date;
  similarityThreshold?: number;
  semanticMatching?: boolean;
  teacherId?: string;
  questionType?: QuestionType;
  options?: string[];
  ratingMin?: number;
  ratingMax?: number;
  gridRows?: string[];
  gridColumns?: string[];
}

export type QuestionType = 'text' | 'multiple-choice' | 'rating' | 'grid';

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
