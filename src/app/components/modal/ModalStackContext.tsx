'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

interface ModalStackContextValue {
  register: (id: string) => () => void;
  getStackIndex: (id: string) => number;
  isTop: (id: string) => boolean;
  count: number;
}

const ModalStackContext = createContext<ModalStackContextValue | null>(null);

export const MODAL_BASE_Z_INDEX = 999990;

export function ModalStackProvider({ children }: { children: React.ReactNode }) {
  const stackRef = useRef<string[]>([]);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const register = useCallback((id: string) => {
    if (!stackRef.current.includes(id)) {
      stackRef.current = [...stackRef.current, id];
      bump();
    }
    return () => {
      const next = stackRef.current.filter((x) => x !== id);
      if (next.length !== stackRef.current.length) {
        stackRef.current = next;
        bump();
      }
    };
  }, []);

  const getStackIndex = useCallback((id: string) => stackRef.current.indexOf(id), []);

  const isTop = useCallback((id: string) => {
    const stack = stackRef.current;
    return stack.length > 0 && stack[stack.length - 1] === id;
  }, []);

  const count = stackRef.current.length;

  const value = useMemo(
    () => ({ register, getStackIndex, isTop, count }),
    [register, getStackIndex, isTop, count]
  );

  useEffect(() => {
    if (stackRef.current.length > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [count]);

  return (
    <ModalStackContext.Provider value={value}>{children}</ModalStackContext.Provider>
  );
}

export function useModalStack() {
  return useContext(ModalStackContext);
}
