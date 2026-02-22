export interface MathQuestion {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  /** Optional image URL or base64 data URL (e.g. for geometry diagrams) */
  image?: string;
}
