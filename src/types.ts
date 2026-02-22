export interface MathQuestion {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}
