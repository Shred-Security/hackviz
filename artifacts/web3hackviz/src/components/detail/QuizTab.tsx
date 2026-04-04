"use client";
import { useState } from "react";
import { Hack } from "@/data/hacks";
import { CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";

export function QuizTab({ hack, onMastered }: { hack: Hack; onMastered?: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);

  const questions = hack.quiz;

  const selectAnswer = (qi: number, ai: number) => {
    if (submitted[qi]) return;
    setAnswers((prev) => ({ ...prev, [qi]: ai }));
  };

  const submitAnswer = (qi: number) => {
    if (answers[qi] == null) return;
    setSubmitted((prev) => ({ ...prev, [qi]: true }));
  };

  const reset = () => {
    setAnswers({});
    setSubmitted({});
    setDone(false);
  };

  const allAnswered = questions.every((_, i) => submitted[i]);
  const correctCount = questions.filter((q, i) => answers[i] === q.correct).length;

  const handleFinish = () => {
    setDone(true);
    if (correctCount === questions.length && onMastered) {
      onMastered();
    }
  };

  if (done) {
    const pct = Math.round((correctCount / questions.length) * 100);
    const mastered = correctCount === questions.length;
    return (
      <div className="py-12 flex flex-col items-center text-center gap-6">
        <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center
          ${mastered ? "border-yellow-400 bg-yellow-400/10" : "border-cyan-400 bg-cyan-400/10"}`}>
          {mastered
            ? <Trophy className="w-10 h-10 text-yellow-400" />
            : <CheckCircle className="w-10 h-10 text-cyan-400" />
          }
        </div>
        <div>
          <div className={`text-4xl font-bold font-mono ${mastered ? "text-yellow-400" : "text-cyan-400"}`}>
            {correctCount}/{questions.length}
          </div>
          <div className="text-muted-foreground text-sm mt-1">
            {mastered
              ? "Perfect score! You've mastered this exploit."
              : `${pct}% correct — review the lessons and try again.`
            }
          </div>
          {mastered && (
            <div className="mt-3 text-xs text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 rounded px-3 py-1.5 inline-block">
              Marked as Mastered
            </div>
          )}
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-4 py-2 rounded border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Test your understanding of the {hack.title} exploit.
        </p>
        <span className="text-xs text-muted-foreground">
          {Object.keys(submitted).length}/{questions.length} answered
        </span>
      </div>

      {questions.map((q, qi) => {
        const isSubmitted = submitted[qi];
        const selectedAnswer = answers[qi] ?? null;
        const isCorrect = selectedAnswer === q.correct;

        return (
          <div key={qi} className="rounded-lg border border-border/50 bg-card overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 mt-0.5">
                  {qi + 1}
                </span>
                <p className="text-sm text-foreground font-medium leading-relaxed">{q.question}</p>
              </div>

              <div className="space-y-2 pl-9">
                {q.options.map((opt, ai) => {
                  let style = "border-border/40 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground";
                  if (selectedAnswer === ai && !isSubmitted) {
                    style = "border-primary/50 bg-primary/15 text-foreground";
                  }
                  if (isSubmitted) {
                    if (ai === q.correct) {
                      style = "border-green-400/50 bg-green-400/10 text-green-300";
                    } else if (ai === selectedAnswer && ai !== q.correct) {
                      style = "border-red-400/50 bg-red-400/10 text-red-300";
                    } else {
                      style = "border-border/20 bg-muted/10 text-muted-foreground opacity-50";
                    }
                  }

                  return (
                    <button
                      key={ai}
                      onClick={() => selectAnswer(qi, ai)}
                      disabled={isSubmitted}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded border text-xs transition-all ${style}`}
                    >
                      <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0">
                        {String.fromCharCode(65 + ai)}
                      </span>
                      <span className="leading-relaxed">{opt}</span>
                      {isSubmitted && ai === q.correct && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 ml-auto shrink-0" />
                      )}
                      {isSubmitted && ai === selectedAnswer && ai !== q.correct && (
                        <XCircle className="w-3.5 h-3.5 text-red-400 ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {!isSubmitted && (
                <div className="mt-4 pl-9">
                  <button
                    onClick={() => submitAnswer(qi)}
                    disabled={selectedAnswer == null}
                    className="px-4 py-1.5 rounded text-xs font-medium bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-all disabled:opacity-30"
                  >
                    Submit
                  </button>
                </div>
              )}

              {isSubmitted && (
                <div className={`mt-4 ml-9 rounded p-3 text-[11px] leading-relaxed border
                  ${isCorrect ? "bg-green-400/5 border-green-400/20 text-green-300" : "bg-red-400/5 border-red-400/20 text-red-300"}`}>
                  <span className="font-medium">{isCorrect ? "Correct! " : "Incorrect. "}</span>
                  {q.explanation}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {allAnswered && !done && (
        <div className="flex justify-center">
          <button
            onClick={handleFinish}
            className="px-6 py-2.5 rounded bg-primary/20 border border-primary/40 text-primary font-semibold text-sm hover:bg-primary/30 transition-all"
          >
            See Results
          </button>
        </div>
      )}
    </div>
  );
}
