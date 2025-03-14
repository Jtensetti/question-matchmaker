
export const generateCaptcha = (): { question: string; answer: string } => {
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);
  const question = `What is ${num1} + ${num2}?`;
  const answer = (num1 + num2).toString();
  
  return { question, answer };
};
