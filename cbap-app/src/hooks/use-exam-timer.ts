// ============================================================
// useExamTimer — Countdown timer for exam simulation
// 210 minutes (3.5 hours) default duration
// Persists remaining seconds every 5s via callback
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';

const EXAM_DURATION_SECONDS = 210 * 60; // 210 phút

interface ExamTimerOptions {
  initialSeconds?: number;       // Resume từ localStorage nếu có
  onTimeUp: () => void;          // Callback khi hết giờ → tự động nộp bài
  onTick?: (remaining: number) => void; // Callback mỗi giây (để persist)
}

interface ExamTimerResult {
  remainingSeconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (seconds?: number) => void;
}

export function useExamTimer({
  initialSeconds = EXAM_DURATION_SECONDS,
  onTimeUp,
  onTick,
}: ExamTimerOptions): ExamTimerResult {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const onTimeUpRef = useRef(onTimeUp);
  const onTickRef = useRef(onTick);
  const persistCountRef = useRef(0);

  // Keep refs updated to avoid stale closures
  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onTimeUpRef.current();
          return 0;
        }

        const next = prev - 1;

        // Persist mỗi 5 giây
        persistCountRef.current += 1;
        if (persistCountRef.current % 5 === 0) {
          onTickRef.current?.(next);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((seconds = EXAM_DURATION_SECONDS) => {
    setIsRunning(false);
    setRemainingSeconds(seconds);
  }, []);

  return { remainingSeconds, isRunning, start, pause, reset };
}
