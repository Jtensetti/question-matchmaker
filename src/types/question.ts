
export interface Question {
  id: string;
  text: string;
  answer: string;
  createdAt: Date;
}

export interface StudentAnswer {
  questionId: string;
  answer: string;
}
