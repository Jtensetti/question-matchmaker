
export interface Question {
  id: string;
  text: string;
  answer: string;
  createdAt: Date;
  similarityThreshold?: number; // Default will be 0.7 (70%)
}

export interface StudentAnswer {
  questionId: string;
  answer: string;
}
