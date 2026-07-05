"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Toast from "@/components/ui/Toast";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  dismiss: (id: string) => void;
}

const noop = () => {};

const ToastContext = createContext<ToastContextType>({
  toast: { success: noop, error: noop, info: noop },
  dismiss: noop,
});

const TOAST_DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  React.useEffect(() => {
    setMounted(true);
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id =
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      setToasts((prev) => [...prev, { id, type, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_DURATION)
      );
    },
    [dismiss]
  );

  const toast = React.useMemo(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
      info: (message: string) => push("info", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:items-end">
            <div className="flex w-full max-w-sm flex-col gap-2">
              {toasts.map((item) => (
                <Toast key={item.id} toast={item} onDismiss={dismiss} />
              ))}
            </div>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext).toast;
