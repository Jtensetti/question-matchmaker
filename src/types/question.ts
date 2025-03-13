
export interface Question {
  id: string;
  text: string;
  answer: string;
  createdAt: Date;
  similarityThreshold?: number; // Default will be 0.7 (70%)
  semanticMatching?: boolean; // Whether to use semantic matching instead of string similarity
}

export interface StudentAnswer {
  id: string;
  questionId: string;
  studentName: string;
  answer: string;
  submittedAt: Date;
  isCorrect?: boolean;
}
