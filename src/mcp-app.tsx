/**
 * Math Quiz MCP App - Interactive quiz UI for 6th grade math.
 * Receives questions via ontoolinput when Claude calls display_math_quiz.
 */
import type { App } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import type { MathQuestion } from "./types";
import styles from "./quiz.module.css";

function MathQuizApp() {
  const [questions, setQuestions] = useState<MathQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const { app, error } = useApp({
    appInfo: { name: "Math Quiz App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app: App) => {
      app.onteardown = async () => ({});
      app.ontoolinput = (params) => {
        const args = params.arguments as { questions?: MathQuestion[] };
        if (args?.questions && Array.isArray(args.questions)) {
          setQuestions(args.questions);
        }
      };
      app.onerror = console.error;
    },
  });

  const handleSelectAnswer = useCallback((questionId: number, optionIndex: number) => {
    setAnswers((prev) => {
      if (prev[questionId] !== undefined) return prev;
      return { ...prev, [questionId]: optionIndex };
    });
  }, []);

  const correctCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] === q.correctIndex
  ).length;
  const incorrectCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== q.correctIndex
  ).length;
  const answeredCount = Object.keys(answers).length;

  if (error) {
    return (
      <div className={styles.connecting}>
        <strong>Error:</strong> {error.message}
      </div>
    );
  }

  if (!app) {
    return <div className={styles.connecting}>Connecting...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className={styles.empty}>
        Ask Claude to generate a math quiz! For example: &quot;Give my son 10
        6th grade math questions with 4 answer choices each.&quot;
      </div>
    );
  }

  return (
    <main
      className={styles.quiz}
      style={{
        paddingTop: (app.getHostContext() as McpUiHostContext | undefined)?.safeAreaInsets?.top,
        paddingRight: (app.getHostContext() as McpUiHostContext | undefined)?.safeAreaInsets?.right,
        paddingBottom: (app.getHostContext() as McpUiHostContext | undefined)?.safeAreaInsets?.bottom,
        paddingLeft: (app.getHostContext() as McpUiHostContext | undefined)?.safeAreaInsets?.left,
      }}
    >
      <div className={styles.scoreBar}>
        <span className={styles.scoreCorrect}>{correctCount} correct</span>
        <span className={styles.scoreIncorrect}>{incorrectCount} incorrect</span>
        <span>
          {answeredCount} / {questions.length} answered
        </span>
      </div>

      <div className={styles.questionsList}>
        {questions.map((q) => {
          const selected = answers[q.id];
          const isAnswered = selected !== undefined;
          const isCorrect = isAnswered && selected === q.correctIndex;

          return (
            <div key={q.id} className={styles.questionCard}>
              <div className={styles.questionText}>
                {q.id}. {q.question}
              </div>
              <div className={styles.options}>
                {q.options.map((opt, idx) => {
                  let optionClass = styles.option;
                  if (isAnswered) optionClass += ` ${styles.optionDisabled}`;
                  if (selected === idx) optionClass += ` ${styles.optionSelected}`;
                  if (isAnswered && idx === q.correctIndex)
                    optionClass += ` ${styles.optionCorrect}`;
                  if (isAnswered && selected === idx && !isCorrect)
                    optionClass += ` ${styles.optionIncorrect}`;

                  return (
                    <button
                      key={idx}
                      className={optionClass}
                      onClick={() => handleSelectAnswer(q.id, idx)}
                      disabled={isAnswered}
                    >
                      {String.fromCharCode(65 + idx)}. {opt}
                    </button>
                  );
                })}
              </div>
              {isAnswered && (
                <div
                  className={`${styles.feedback} ${
                    isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
                  }`}
                >
                  {isCorrect ? "Correct!" : "Incorrect."}
                  <div className={styles.feedbackExplanation}>{q.explanation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MathQuizApp />
  </StrictMode>
);
