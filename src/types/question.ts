
export interface Question {
  id: string;
  text: string;
  answer: string;
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
  ratingCorrect?: number;
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
