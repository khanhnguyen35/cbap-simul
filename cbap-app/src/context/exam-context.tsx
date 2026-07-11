// ============================================================
// ExamContext — Global state management for the application
// Manages: questions, history, bookmarks, ongoing session
// Syncs history + bookmarks + session to Firestore (or localStorage if guest)
// ============================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from './auth-context';
import type { Question, ExamHistory, OngoingSession, ExamMode, QuestionBuckets } from '@/types/exam';
import { LS_KEYS, calculateScore } from '@/utils/data-filter';

// ── State Shape ──────────────────────────────────────────────

interface ExamState {
  allQuestions: Question[];
  buckets: QuestionBuckets;
  isDataLoaded: boolean;
  examHistory: ExamHistory[];
  bookmarks: Set<string>;
  ongoingSession: OngoingSession | null;
}

// ── Actions ──────────────────────────────────────────────────

type ExamAction =
  | { type: 'SET_DATA'; payload: { questions: Question[]; buckets: QuestionBuckets } }
  | { type: 'SET_SYNC_DATA'; payload: { history: ExamHistory[]; bookmarks: string[]; session: OngoingSession | null } }
  | { type: 'START_SESSION'; payload: OngoingSession }
  | { type: 'SUBMIT_ANSWER'; payload: { questionId: string; letter: string } }
  | { type: 'TOGGLE_BOOKMARK'; payload: string }
  | { type: 'UPDATE_TIMER'; payload: number }
  | { type: 'SUBMIT_SESSION' }
  | { type: 'CLEAR_SESSION' }
  | { type: 'DELETE_HISTORY'; payload: string }; // historyId

// ── Reducer ──────────────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function initialState(): ExamState {
  // Bắt đầu bằng local storage cho tốc độ khởi động nhanh
  const historyRaw = loadFromStorage<ExamHistory[]>(LS_KEYS.history, []);
  const bookmarksRaw = loadFromStorage<string[]>(LS_KEYS.bookmarks, []);
  const session = loadFromStorage<OngoingSession | null>(LS_KEYS.ongoingSession, null);

  return {
    allQuestions: [],
    buckets: { usable: [], flashcardOnly: [], broken: [] },
    isDataLoaded: false,
    examHistory: historyRaw,
    bookmarks: new Set(bookmarksRaw),
    ongoingSession: session,
  };
}

function reducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        allQuestions: action.payload.questions,
        buckets: action.payload.buckets,
        isDataLoaded: true,
      };
      
    case 'SET_SYNC_DATA':
      return {
        ...state,
        examHistory: action.payload.history,
        bookmarks: new Set(action.payload.bookmarks),
        ongoingSession: action.payload.session,
      };

    case 'START_SESSION':
      return { ...state, ongoingSession: action.payload };

    case 'SUBMIT_ANSWER': {
      if (!state.ongoingSession) return state;
      const updated: OngoingSession = {
        ...state.ongoingSession,
        userAnswers: {
          ...state.ongoingSession.userAnswers,
          [action.payload.questionId]: action.payload.letter,
        },
      };
      return { ...state, ongoingSession: updated };
    }

    case 'TOGGLE_BOOKMARK': {
      const id = action.payload;
      const newBookmarks = new Set(state.bookmarks);
      if (newBookmarks.has(id)) {
        newBookmarks.delete(id);
      } else {
        newBookmarks.add(id);
      }
      const session = state.ongoingSession
        ? { ...state.ongoingSession, bookmarks: Array.from(newBookmarks) }
        : null;
      return { ...state, bookmarks: newBookmarks, ongoingSession: session };
    }

    case 'UPDATE_TIMER': {
      if (!state.ongoingSession) return state;
      return {
        ...state,
        ongoingSession: { ...state.ongoingSession, remainingSeconds: action.payload },
      };
    }

    case 'SUBMIT_SESSION': {
      if (!state.ongoingSession) return state;

      const session = state.ongoingSession;
      const sessionQuestions = state.allQuestions.filter((q) =>
        session.questionIds.includes(q.id)
      );
      const { correct, total, percentage } = calculateScore(
        sessionQuestions,
        session.userAnswers
      );

      const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);

      const historyEntry: ExamHistory = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        examNumber: session.examNumber,
        mode: session.mode,
        timestamp: Date.now(),
        durationUsed: elapsed,
        totalQuestions: total,
        correctAnswersCount: correct,
        scorePercentage: percentage,
        userAnswers: session.userAnswers,
      };

      return {
        ...state,
        examHistory: [historyEntry, ...state.examHistory],
        ongoingSession: null,
      };
    }

    case 'DELETE_HISTORY':
      return {
        ...state,
        examHistory: state.examHistory.filter((h) => h.id !== action.payload),
      };

    case 'CLEAR_SESSION':
      return { ...state, ongoingSession: null };

    default:
      return state;
  }
}

// ── Context + Provider ───────────────────────────────────────

interface ExamContextValue {
  state: ExamState;
  setData: (questions: Question[], buckets: QuestionBuckets) => void;
  startSession: (examNumber: number, mode: ExamMode, questionIds: string[]) => void;
  submitAnswer: (questionId: string, letter: string) => void;
  toggleBookmark: (questionId: string) => void;
  updateTimer: (seconds: number) => void;
  submitSession: () => void;
  deleteHistory: (historyId: string) => void;
  clearSession: () => void;
}

const ExamContext = createContext<ExamContextValue | null>(null);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const { currentUser } = useAuth();
  
  // Flag to prevent writing empty local state to Firestore before fetching
  const [hasFetchedFromCloud, setHasFetchedFromCloud] = React.useState(false);

  // ── Sync from Firestore when user logs in ─────────────────
  useEffect(() => {
    if (!currentUser) {
      setHasFetchedFromCloud(false);
      return;
    }
    
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Merge history to prevent local data loss
          const firestoreHistory: ExamHistory[] = data.examHistory || [];
          const localHistory: ExamHistory[] = state.examHistory;
          
          const mergedMap = new Map<string, ExamHistory>();
          localHistory.forEach(h => mergedMap.set(h.id, h));
          firestoreHistory.forEach(h => mergedMap.set(h.id, h));
          const mergedHistory = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);

          // Merge bookmarks
          const mergedBookmarks = new Set([...state.bookmarks, ...(data.bookmarks || [])]);

          dispatch({
            type: 'SET_SYNC_DATA',
            payload: {
              history: mergedHistory,
              bookmarks: Array.from(mergedBookmarks),
              session: data.ongoingSession || state.ongoingSession,
            },
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Firestore:", error);
      } finally {
        setHasFetchedFromCloud(true);
      }
    };
    
    fetchUserData();
  }, [currentUser]);

  // ── Sync to Storage (Firebase + Local) on change ──────────
  useEffect(() => {
    // 1. Lưu LocalStorage cho Guest Mode
    localStorage.setItem(LS_KEYS.history, JSON.stringify(state.examHistory));
    localStorage.setItem(LS_KEYS.bookmarks, JSON.stringify(Array.from(state.bookmarks)));
    if (state.ongoingSession) {
      localStorage.setItem(LS_KEYS.ongoingSession, JSON.stringify(state.ongoingSession));
    } else {
      localStorage.removeItem(LS_KEYS.ongoingSession);
    }
    
    // 2. Lưu Firestore nếu đã đăng nhập và ĐÃ tải xong dữ liệu
    if (currentUser && hasFetchedFromCloud) {
      const syncToFirebase = async () => {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, {
            examHistory: state.examHistory,
            bookmarks: Array.from(state.bookmarks),
            ongoingSession: state.ongoingSession
          }, { merge: true });
        } catch (error) {
          console.error("Lỗi khi lưu dữ liệu lên Firestore:", error);
        }
      };
      
      // Debounce call to Firebase could be implemented here if performance is an issue
      syncToFirebase();
    }
  }, [state.examHistory, state.bookmarks, state.ongoingSession, currentUser, hasFetchedFromCloud]);

  // ── Action creators ──────────────────────────────────────
  const setData = useCallback((questions: Question[], buckets: QuestionBuckets) => {
    dispatch({ type: 'SET_DATA', payload: { questions, buckets } });
  }, []);

  const startSession = useCallback((examNumber: number, mode: ExamMode, questionIds: string[]) => {
    const session: OngoingSession = {
      examNumber,
      mode,
      questionIds,
      userAnswers: {},
      bookmarks: [],
      remainingSeconds: 210 * 60,
      startedAt: Date.now(),
    };
    dispatch({ type: 'START_SESSION', payload: session });
  }, []);

  const submitAnswer = useCallback((questionId: string, letter: string) => {
    dispatch({ type: 'SUBMIT_ANSWER', payload: { questionId, letter } });
  }, []);

  const toggleBookmark = useCallback((questionId: string) => {
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: questionId });
  }, []);

  const updateTimer = useCallback((seconds: number) => {
    dispatch({ type: 'UPDATE_TIMER', payload: seconds });
  }, []);

  const submitSession = useCallback(() => {
    dispatch({ type: 'SUBMIT_SESSION' });
  }, []);

  const deleteHistory = useCallback((historyId: string) => {
    dispatch({ type: 'DELETE_HISTORY', payload: historyId });
  }, []);

  const clearSession = useCallback(() => {
    dispatch({ type: 'CLEAR_SESSION' });
  }, []);

  return (
    <ExamContext.Provider
      value={{
        state,
        setData,
        startSession,
        submitAnswer,
        toggleBookmark,
        updateTimer,
        submitSession,
        deleteHistory,
        clearSession,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
}

// ── Custom hook to consume context ───────────────────────────

export function useExamContext(): ExamContextValue {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error('useExamContext must be used within ExamProvider');
  return ctx;
}
