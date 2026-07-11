// ============================================================
// useTsvParser — Load & parse TSV data files at runtime
// Loads both questions.tsv and answers.tsv in parallel
// Results are memoized; only loaded once per session
// ============================================================

import { useState, useEffect, useRef } from 'react';
import type { Question, QuestionBuckets } from '@/types/exam';
import type { QuestionRecord, AnswerRecord } from '@/types/exam';
import {
  parseTsvText,
  joinQuestionsAndAnswers,
  classifyQuestions,
} from '@/utils/tsv-helper';

interface TsvParserResult {
  allQuestions: Question[];
  buckets: QuestionBuckets;
  isLoading: boolean;
  error: string | null;
}

// Module-level cache — survives React strict mode double-invoke
let cachedQuestions: Question[] | null = null;
let cachedBuckets: QuestionBuckets | null = null;

export function useTsvParser(): TsvParserResult {
  const [allQuestions, setAllQuestions] = useState<Question[]>(
    cachedQuestions ?? []
  );
  const [buckets, setBuckets] = useState<QuestionBuckets>(
    cachedBuckets ?? { usable: [], flashcardOnly: [], broken: [] }
  );
  const [isLoading, setIsLoading] = useState<boolean>(cachedQuestions === null);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(cachedQuestions !== null);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function loadData() {
      try {
        // Load cả 2 file song song
        const [qRes, aRes] = await Promise.all([
          fetch('/exams/questions.tsv'),
          fetch('/exams/answers.tsv'),
        ]);

        if (!qRes.ok) throw new Error(`Không tải được questions.tsv (${qRes.status})`);
        if (!aRes.ok) throw new Error(`Không tải được answers.tsv (${aRes.status})`);

        const [qText, aText] = await Promise.all([qRes.text(), aRes.text()]);

        const rawQuestions = parseTsvText<QuestionRecord>(qText);
        const rawAnswers = parseTsvText<AnswerRecord>(aText);

        const questions = joinQuestionsAndAnswers(rawQuestions, rawAnswers);
        const classified = classifyQuestions(questions);

        // Cache at module level
        cachedQuestions = questions;
        cachedBuckets = classified;

        setAllQuestions(questions);
        setBuckets(classified);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi tải dữ liệu';
        setError(msg);
        console.error('[useTsvParser]', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return { allQuestions, buckets, isLoading, error };
}
