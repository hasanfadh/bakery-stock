"use client";
import { useEffect, useState } from "react";

export interface ToastMessage {
  id: number;
  type: "success" | "error";
  message: string;
  refNo?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onRemove, 300);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transform transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[260px] max-w-sm ${
          toast.type === "success"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
        }`}
      >
        <span className="text-lg mt-0.5">
          {toast.type === "success" ? "✅" : "❌"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{toast.message}</p>
          {toast.refNo && (
            <p className="text-xs mt-1 opacity-80 font-mono">{toast.refNo}</p>
          )}
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onRemove, 300);
          }}
          className="opacity-60 hover:opacity-100 text-white ml-1 shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}

// Hook untuk pakai toast lebih mudah
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  let counter = 0;

  const addToast = (type: "success" | "error", message: string, refNo?: string) => {
    const id = Date.now() + counter++;
    setToasts((prev) => [...prev, { id, type, message, refNo }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
